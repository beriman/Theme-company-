import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Let's fix handlePromptChange because the issue might be the text replacement
