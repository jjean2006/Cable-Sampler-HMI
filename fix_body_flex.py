import re

with open('src/css/base/reset.css', 'r') as f:
    css = f.read()

old_body = """html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-app);
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}"""

new_body = """html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}"""

if old_body in css:
    with open('src/css/base/reset.css', 'w') as f:
        f.write(css.replace(old_body, new_body))
    print("Success")
else:
    print("Failed to find old body")
