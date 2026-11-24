# 🚀 WebCorC - Getting Started

WebCorC is the web-based CbC IDE. You can use the public instance right away or [run it yourself](./gettingstarted_dev.md).

### 🔗 Open the Tool

Open the public instance at [corc.informatik.kit.edu](https://corc.informatik.kit.edu/).

!!! warning "Browser support"
    WebKit-based browsers such as Safari are **not** supported. Use Chrome, Edge, or Firefox.

### 🏁 Landing Page

The landing page offers several actions to choose from.

| Action | What it does |
|---|---|
| 💡 **Load Example** | Choose a predefined example to be opened to try out WebCorC |
| 📩 **Import File** | Import an individual CbC diagram (.json) |
| 📃 **Import Project** | Import a whole WebCorC project (project .json) |
| 📂 **Open Project** | Open a project that already exists using its ID |

### 🗄️ Working with Examples

1. Choose an example to be opened from the landing page. The graphical editor will open with the chosen program shown.
2. Click **Verify** in the top bar.
3. Save the program with an individual name.
4. WebCorC checks every refinement step with the deductive verifier [KeY](https://www.key-project.org/).
5. Results of the verification are shown in the *‹› Console* tab on the right hand side of the UI. The verification result is also color-coded in the graphical editor at the respective refinement step.

### 🧰 Modifying CbC Programs

- The CbC program shown in the editor can be edited where necessary. Specifications may only be edited where introduced. The specification language is JML.
- Assignments and methods calls require explicit Java code.
- Once a project is saved, triggering verification auto-saves the current project status.

