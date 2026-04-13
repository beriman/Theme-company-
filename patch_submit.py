import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix verify error where playwright clicks task but nothing happens (maybe there's multiple + task buttons?)
