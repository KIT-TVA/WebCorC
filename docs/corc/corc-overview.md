# CorC
An eclipse-based CbC development environment that supports a plethora of features.

# Extensions
The CorC ecosystem provides a plethora of extensions. We now list the most commonly used extensions. Most extensions not listed here are accessible through the context menu in CorC.


-- from readme corc

# Contribution
1. Create a fork.
2. Create a new branch with a name that describes your new feature.
3. Ensure that the command `mvn compile spotless:apply` runs successfully.
4. Start a pull request.

## Formatting
We use the default Eclipse formatting style with [spotless](https://github.com/diffplug/spotless/blob/main/plugin-maven/README.md#eclipse-jdt). Run `mvn spotless:apply` to format all src files automatically if needed.

# Examples & Case Study Introduction
We provide different examples and case studies to explore CorC!
## Examples
Create CorC-examples via `File -> New -> Other... -> CorC -> CorC Examples`.
## Case studies
The repository you checked out contains various software product line case studies in the folder `CaseStudies`. They can be loaded via `File -> Open project from file system`. 
### BankAccount
The BankAccount implements basic functions of a bank account such as withdrawals, limits, money transfers and checking the account balance.
- **BankAccount** Object-oriented implementation with class structure and CbC-Classes.
- **BankAccountOO** Object-oriented implementation with class structure and CbC-Classes. Non-SPL implementation.
### Elevator
The Elevator implements basic functions of an elevator such as the movement and entering and leaving of persons.
- **Elevator** Object-oriented implementation with class structure and CbC-Classes.
### Email
The product line Email implements basic functions of an email system including server- and client-side interactions.
- **EmailOO** Object-oriented implementation with class structure and CbC-Classes. Non-SPL implementation.
- **EmailFeatureInteraction** Java-Implementation without implementation with CbC.
### IntegerList
The IntegerList implements a list of integers with add and sort operations.
- **IntegerList** Object-oriented implementation with class structure and CbC-Classes.
- **IntegerListOO** Object-oriented implementation with class structure and CbC-Classes. Non-SPL implementation.
