#!/usr/bin/env python3
"""
tests/test_server.py
Zero-dependency HTTP server for CableSampler HMI testing.
Features:
- Standard library only (Python 3.12 compatible)
- Strict MIME types for ES6 modules (.js, .mjs), CSS, SVG, JSON
- Anti-caching headers (Cache-Control: no-cache, no-store, must-revalidate)
- Fixed or ephemeral/dynamic port binding
- Tracking of HTTP 404/500 errors and missing assets
- Context manager support for automated scripts
"""

import http.server
import socketserver
import socket
import threading
import os
import sys
import argparse
import time

MIME_TYPES = {
    '': 'application/octet-stream',
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
}


class CableSamplerRequestHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = MIME_TYPES

    def __init__(self, *args, directory=None, server_ref=None, **kwargs):
        self.server_ref = server_ref
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self):
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        # Strict anti-caching and CORS headers for reliable module testing
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        # Intercept status codes and track 4xx / 5xx errors
        status_code = args[1] if len(args) > 1 else '000'
        client_ip = self.client_address[0]
        request_line = args[0] if len(args) > 0 else ''

        record = {
            'timestamp': time.time(),
            'client': client_ip,
            'request': request_line,
            'status': status_code
        }

        if hasattr(self.server, 'request_logs'):
            self.server.request_logs.append(record)

        if status_code not in ('200', '304', '204'):
            if hasattr(self.server, 'error_logs'):
                self.server.error_logs.append(record)
            if not getattr(self.server, 'quiet', False):
                sys.stderr.write(f"[TEST_SERVER_ERROR] {request_line} -> Status {status_code}\n")
        elif not getattr(self.server, 'quiet', False):
            sys.stdout.write(f"[TEST_SERVER] {request_line} -> Status {status_code}\n")


class CableSamplerTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

    def __init__(self, server_address, RequestHandlerClass, directory=None, quiet=False):
        self.directory = directory or os.getcwd()
        self.quiet = quiet
        self.request_logs = []
        self.error_logs = []
        super().__init__(
            server_address,
            lambda *args, **kwargs: RequestHandlerClass(
                *args, directory=self.directory, **kwargs
            )
        )


class CableSamplerTestServer:
    """Convenience wrapper for launching background HTTP test servers."""

    def __init__(self, port=8080, host="127.0.0.1", root_dir=None, quiet=False):
        self.host = host
        self.requested_port = port
        self.root_dir = root_dir or os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..')
        )
        self.quiet = quiet
        self.server = None
        self.thread = None
        self.port = port

    def start(self):
        # If requested_port is 0 or bound, find available port
        for attempt_port in ([self.requested_port] if self.requested_port != 0 else [0]):
            try:
                self.server = CableSamplerTCPServer(
                    (self.host, attempt_port),
                    CableSamplerRequestHandler,
                    directory=self.root_dir,
                    quiet=self.quiet
                )
                self.port = self.server.server_address[1]
                break
            except OSError:
                if self.requested_port != 0 and attempt_port == self.requested_port:
                    # Fallback to dynamic port if requested port is taken
                    self.server = CableSamplerTCPServer(
                        (self.host, 0),
                        CableSamplerRequestHandler,
                        directory=self.root_dir,
                        quiet=self.quiet
                    )
                    self.port = self.server.server_address[1]
                    break
                raise

        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        if not self.quiet:
            print(f"[TEST_SERVER] Serving '{self.root_dir}' at http://{self.host}:{self.port}")
        return self

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            self.server = None
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)
            self.thread = None

    @property
    def error_logs(self):
        return self.server.error_logs if self.server else []

    @property
    def request_logs(self):
        return self.server.request_logs if self.server else []

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()


def main():
    parser = argparse.ArgumentParser(description="CableSampler Zero-Dependency Test HTTP Server")
    parser.add_argument("--port", "-p", type=int, default=8080, help="Port to listen on (default 8080, 0 for dynamic)")
    parser.add_argument("--host", default="127.0.0.1", help="Host binding (default 127.0.0.1)")
    parser.add_argument("--dir", "-d", default=None, help="Root directory to serve (default CableSampler workspace)")
    parser.add_argument("--quiet", "-q", action="store_true", help="Suppress access logging")
    args = parser.parse_args()

    server = CableSamplerTestServer(
        port=args.port,
        host=args.host,
        root_dir=args.dir,
        quiet=args.quiet
    )
    server.start()

    print(f"CableSampler Test Server running at http://{server.host}:{server.port}/")
    print("Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.stop()
        print("Server stopped.")


if __name__ == "__main__":
    main()
