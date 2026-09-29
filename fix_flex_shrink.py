import re

with open('src/css/base/reset.css', 'r') as f:
    css = f.read()

old = """html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;"""

new = """html, body {
  width: 100%;
  height: 100%;
  height: 100dvh; /* Use dynamic viewport height for mobile URL bars */
  overflow: hidden;
  display: flex;
  flex-direction: column;"""

if old in css:
    with open('src/css/base/reset.css', 'w') as f:
        f.write(css.replace(old, new))
    print("Fixed body")

with open('src/css/layout/container.css', 'r') as f:
    css2 = f.read()

old2 = """/* Main Layout: Sidebar & Content Area */
.hmi-main-layout {
  width: 100%;
  display: flex;
  flex: 1;
  padding: 0;
  gap: 0;
  background-color: var(--bg-app);

  overflow: hidden;
}"""

new2 = """/* Main Layout: Sidebar & Content Area */
.hmi-main-layout {
  width: 100%;
  display: flex;
  flex: 1;
  min-height: 0; /* Crucial: allows flex item to shrink smaller than content */
  padding: 0;
  gap: 0;
  background-color: var(--bg-app);
  overflow: hidden;
}"""

if old2 in css2:
    with open('src/css/layout/container.css', 'w') as f:
        f.write(css2.replace(old2, new2))
    print("Fixed main layout")
else:
    print("Could not find old2 in container.css")
