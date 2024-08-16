# ProjectFileManagementController

All URIs are relative to `"/v1"`

The controller class is defined in **[ProjectFileManagementController.java](../../src/main/java/edu/kit/cbc/web/controller/ProjectFileManagementController.java)**

Method | HTTP request | Description
------------- | ------------- | -------------
[**createFileorDirectory**](#createFileorDirectory) | **POST** /projects/{id}/files/{urn} | Create File / Directory
[**deleteFileByURN**](#deleteFileByURN) | **DELETE** /projects/{id}/files/{urn} | Delete File
[**getFileTreeByProjectId**](#getFileTreeByProjectId) | **GET** /projects/{id}/files | Get File / Directory Structure (optional??)
[**readFileContentByURN**](#readFileContentByURN) | **GET** /projects/{id}/files/{urn} | Get Directory or file contents
[**updateProjectFileByURN**](#updateProjectFileByURN) | **PUT** /projects/{id}/files/{urn} | Update File Content

<a id="createFileorDirectory"></a>
# **createFileorDirectory**
```java
Mono<Filecontent> ProjectFileManagementController.createFileorDirectory(idurn)
```

Create File / Directory

Create new File / Directory

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` |  |
**urn** | `String` |  |

### Return type
[**Filecontent**](../../docs/models/Filecontent.md)


### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: `application/json`, `application/problem+json`

<a id="deleteFileByURN"></a>
# **deleteFileByURN**
```java
Mono<Object> ProjectFileManagementController.deleteFileByURN(idurn)
```

Delete File

Delete File

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` |  |
**urn** | `String` |  |



### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: `application/problem+json`

<a id="getFileTreeByProjectId"></a>
# **getFileTreeByProjectId**
```java
Mono<Directory> ProjectFileManagementController.getFileTreeByProjectId(id)
```

Get File / Directory Structure (optional??)

Create new File / Directory

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` |  |

### Return type
[**Directory**](../../docs/models/Directory.md)


### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: `application/json`, `application/problem+json`

<a id="readFileContentByURN"></a>
# **readFileContentByURN**
```java
Mono<Filecontent> ProjectFileManagementController.readFileContentByURN(idurn)
```

Get Directory or file contents

Read all Project Files

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` |  |
**urn** | `String` |  |

### Return type
[**Filecontent**](../../docs/models/Filecontent.md)


### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: `application/json`, `application/problem+json`

<a id="updateProjectFileByURN"></a>
# **updateProjectFileByURN**
```java
Mono<Filecontent> ProjectFileManagementController.updateProjectFileByURN(idurn)
```

Update File Content

Update file content

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` |  |
**urn** | `String` |  |

### Return type
[**Filecontent**](../../docs/models/Filecontent.md)


### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: `application/json`, `application/problem+json`

