import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace Task button logic with a clearer selector test or just change text to '+ New Task' to avoid conflicts
content = content.replace("Task</button>", "+ Task</button>")
with open('src/App.tsx', 'w') as f:
    f.write(content)
