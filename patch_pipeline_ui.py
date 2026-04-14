import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add pipeline state to the app
pipeline_form_str = """const [newProjectForm, setNewProjectForm] = useState({ title: '', prompt: '' });"""
pipeline_form_replace = """const [newProjectForm, setNewProjectForm] = useState({ title: '', prompt: '', pipeline: [] as string[] });"""
content = content.replace(pipeline_form_str, pipeline_form_replace)

create_proj_str = """const newProj: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: newProjectForm.title,
      prompt: newProjectForm.prompt,
      status: 'open'
    };"""
create_proj_replace = """const newProj: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: newProjectForm.title,
      prompt: newProjectForm.prompt,
      status: 'open',
      pipeline: newProjectForm.pipeline,
      pipelineIndex: 0
    };"""
content = content.replace(create_proj_str, create_proj_replace)

reset_proj_form_str = """setNewProjectForm({ title: '', prompt: '' });"""
reset_proj_form_replace = """setNewProjectForm({ title: '', prompt: '', pipeline: [] });"""
content = content.replace(reset_proj_form_str, reset_proj_form_replace)

with open('src/App.tsx', 'w') as f:
    f.write(content)
