# 🪐 CorC (Eclipse) - Getting Started

To use the Eclipse-version of CorC, follow the following guide for setup. The guide is validated for Windows setup.

## ♨️ Java Version

Install [**JDK 21**](https://www.oracle.com/java/technologies/downloads/#java21). CorC may not work out of the box with newer versions.

## ⚙️ Eclipse Modelling Tools and Plugins

- Install [Eclipse Modelling Tools (EMT)](https://www.eclipse.org/downloads/packages/release/2024-03/r/eclipse-modeling-tools) (Version 2024-03). CorC may not work out of the box with newer versions.
- Get the latest release of [Z3](https://github.com/Z3Prover/z3/releases) and add the `*/z3-[cur-version]-[x64/x32]-win/bin` folder to the environment variable [PATH](https://www.wikihow.com/Change-the-PATH-Environment-Variable-on-Windows)

- Install **Graphiti** using the update site https://download.eclipse.org/graphiti/updates/release/0.18.0

- Install **FeatureIDE** which is available in [Eclipse Marketplace](https://marketplace.eclipse.org/content/featureide)

- Install **Mylyn** which is available in [Eclipse Marketplace](https://marketplace.eclipse.org/content/mylyn) (Mylyn 3.23)

- Install **TestNG** which is available in [Eclipse Marketplace](https://marketplace.eclipse.org/content/testng-eclipse)

## 🍾 CorC Setup
1. Clone the repository:
    ```sh
    git clone https://github.com/KIT-TVA/CorC.git
    ```
2. In EMT, select `Open Projects... -> CorC` and check the boxes for the following packages:
    - `de.tu-bs.cs.isf.cbc.exceptions`
    - `de.tu-bs.cs.isf.cbc.model`
    - `de.tu-bs.cs.isf.cbc.mutation`
    - `de.tu-bs.cs.isf.cbc.tool`
    - `de.tu-bs.cs.isf.cbc.util`
    - `de.tu-bs.cs.isf.cbcclass.tool`
    - `de.tu-bs.cs.isf.wizards`
    - `de.tu_bs.cs.isf.cbc.parser`
    - `de.tu_bs.cs.isf.cbc.statistics`
    - `de.tu_bs.cs.isf.cbc.statistics.ui`
    - `de.tu_bs.cs.isf.commands.toolbar`
    - `de.tu_bs.cs.isf.lattice`
    - `de.tu_bs.cs.isf.proofrepository`
    - `de.kit.tva.lost`

3.  Open:
    - `*.cbc.model -> model -> genmodel.genmodel`
    - `*.cbc.statistics -> model -> cbcstatistics.genmodel` 
    
    Right click and `Generate Model/Edit/Editor Code` for all files listed.
    If EMT still displays errors, clean and rebuild all projects as described in the [common issues](#common-issues) section.

4. Select any package and run project as `Eclipse Application`.

## 🗄️ Getting Started with Examples

We provide a set of exemplary CbC-programs besides our case studies. Refer to [case studies](casestudies.md) to learn what examples and case studies we offer and how to use them.

## 🫠 Common Issues

**Problem:** EMT gets stuck while trying to generate a model.

**Solution:** Terminate EMT using any process manager and generate the model again.

---

**Problem:** Multiple resolving errors after generating model files.

**Solution:** Clean and rebuild all projects via `Project -> Clean...`.

---

**Problem:** Cycling depedency issues.

**Solution:** Navigate to: `Project -> Properties -> Java Compiler -> Building -> Configure Workspace Settings -> Build path problems -> Circular dependencies` and set the listbox to `Warning`.

---

**Problem:** Errors in certain files about undefined methods and classes.

**Solution:** Changing the compliance: `Project -> Java Compiler -> JDK Complicance -> Use compliance from execution environment 'JavaSE-16'`.

---

**Problem:** Errors involving the message 'Cannot modify resource set without a write transaction'.

**Solution:** Delete the folder `.settings` in `org.eclipse.core.runtime` within the current workspace. If that doesn't resolve the issue, delete all `.settings` folders and the `.project` file in the `CorC` folder.

---

**Problem:** Some library file or package that is in the git is not shown locally in eclipse and there are errors missing that file

**Solution:** Press `F5` when hovering over the parent directory of the missing file. The file should appear.