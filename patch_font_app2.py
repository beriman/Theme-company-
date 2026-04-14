import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Instead of adding + Task, let's just make the button uniquely identifiable like id="new-task-btn"
content = content.replace("<button className=\"btn-retro flex items-center justify-center gap-1 lg:gap-2 text-[10px] lg:text-lg py-1 px-2\" onClick={() => setShowNewProject(true)}>", "<button id=\"new-task-btn\" className=\"btn-retro flex items-center justify-center gap-1 lg:gap-2 text-[10px] lg:text-lg py-1 px-2\" onClick={() => setShowNewProject(true)}>")
with open('src/App.tsx', 'w') as f:
    f.write(content)
