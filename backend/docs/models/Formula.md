

# Formula

CBCFormula

The class is defined in **[Formula.java](../../src/main/java/edu/kit/cbc/web/model/Formula.java)**

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | [**TypeEnum**](#TypeEnum) |  | 
**name** | `String` |  | 
**proven** | `Boolean` |  | 
**comment** | `String` |  | 
**compostionTechnique** | [**CompostionTechniqueEnum**](#CompostionTechniqueEnum) |  | 
**className** | `String` |  | 
**methodeName** | `String` |  | 
**javaVariables** | `List&lt;String&gt;` |  | 
**globalConditions** | [`List&lt;Condition&gt;`](Condition.md) |  | 
**preCondition** | `String` |  | 
**postCondition** | `String` |  | 
**statement** | [`Statement`](Statement.md) |  | 

## TypeEnum

Name | Value
---- | -----
CBC_FORMULA | `"CBCFormula"`




## CompostionTechniqueEnum

Name | Value
---- | -----
CONTRACT_OVERRIDING | `"CONTRACT_OVERRIDING"`








## Implemented Interfaces

* `Serializable`


