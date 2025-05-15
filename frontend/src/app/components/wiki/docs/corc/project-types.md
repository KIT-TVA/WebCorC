# Project Types
CorC currently supports three different project types: *Non-object-oriented projects*, *object-oriented projects*, and *software product lines*.

## Non-object Oriented Projects
A non-object-oriented project contains not classes but a finite number of CbC methods. This project type helps create small programs.
1. Create a new Java project.
2. Create a folder named `src`.
3. Handle any CbC program inside the `src` folder.

[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/corc-example-project-structure.png]]

## Object-Oriented Projects
Object-oriented projects are based on CbC classes and CbC methods. We may create a CbC class diagram via the file wizard. Upon creation we'll find a new `.cbcclass` file in the project. CbC class diagrams essentially depict a high-level view of the class, its fields, and methods. CbC class diagrams are internally linked to their respective CbC method diagrams, identified through the `.cbcdiagram` file type, so any variable changes are automatically adjusted in the CbC classes and CbC methods. CbC classes must reside in a folder with the same name. CbC methods reside in the same folder as their respective class.
1. Create a new Java project.
2. Create a folder named `src`.
3. Create a folder with the name of some class `A` inside `src`.
4. Create a CbC class named `A` inside folder `A`.
5. Insert CbC methods belonging to class `A` in folder `A`.
(TODO: Example here.)

[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/oo-structure.png]]

## Software Product Lines
We may implement [software product lines (SPL)](#references) in CorC. The project structure for SPLs requires additional information about their features and underlying feature model, which is given through a model description file.
1. Create a new Java project.
2. Create a folder named `src`.
3. Define a model description file `model.xml` and place it inside the java project.
4. Create one folder for every feature in the model and place them inside folder `src`.
5. Place any CbC classes and methods inside their respective feature folder according to the principles of [object-oriented projects](#object-oriented-projects).

[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/spl-structure.png]]
