# EditorController

All URIs are relative to `"/v1"`

The controller class is defined in **[EditorController.java](../../src/main/java/edu/kit/cbc/web/controller/EditorController.java)**

Method | HTTP request | Description
------------- | ------------- | -------------
[**exportWorkspace**](#exportWorkspace) | **POST** /editor/export | Export current Workspace
[**generateJavaCode**](#generateJavaCode) | **POST** /editor/generate | 
[**readJobStatusByUUID**](#readJobStatusByUUID) | **GET** /editor/jobs/{id} | Get Job Status Over Websocket
[**verifyFormula**](#verifyFormula) | **POST** /editor/verify | Verify Formula

<a id="exportWorkspace"></a>
# **exportWorkspace**
```java
Mono<Object> EditorController.exportWorkspace()
```

Export current Workspace




### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: Not defined

<a id="generateJavaCode"></a>
# **generateJavaCode**
```java
Mono<Object> EditorController.generateJavaCode()
```






### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: Not defined

<a id="readJobStatusByUUID"></a>
# **readJobStatusByUUID**
```java
Mono<Object> EditorController.readJobStatusByUUID(id)
```

Get Job Status Over Websocket

Get Job Status

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` |  |



### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: `application/problem+json`

<a id="verifyFormula"></a>
# **verifyFormula**
```java
Mono<Object> EditorController.verifyFormula(formula)
```

Verify Formula

Verify Formula

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**formula** | [**Formula**](../../docs/models/Formula.md) | Formula to verify | [optional parameter]



### HTTP request headers
 - **Accepts Content-Type**: `application/json`
 - **Produces Content-Type**: `application/problem+json`

