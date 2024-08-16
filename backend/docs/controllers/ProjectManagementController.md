# ProjectManagementController

All URIs are relative to `"/v1"`

The controller class is defined in **[ProjectManagementController.java](../../src/main/java/edu/kit/cbc/web/controller/ProjectManagementController.java)**

Method | HTTP request | Description
------------- | ------------- | -------------
[**createProject**](#createProject) | **POST** /projects | Create new Project
[**deleteProjectById**](#deleteProjectById) | **DELETE** /projects/{id} | Delete Project
[**readProjectById**](#readProjectById) | **GET** /projects/{id} | Get Project by id
[**updateProjectById**](#updateProjectById) | **PUT** /projects/{id} | Update Project

<a id="createProject"></a>
# **createProject**
```java
Mono<Read> ProjectManagementController.createProject(create)
```

Create new Project

Create a new Project

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**create** | [**Create**](../../docs/models/Create.md) | Give Project a name |

### Return type
[**Read**](../../docs/models/Read.md)


### HTTP request headers
 - **Accepts Content-Type**: `application/json`
 - **Produces Content-Type**: `application/json`, `application/problem+json`

<a id="deleteProjectById"></a>
# **deleteProjectById**
```java
Mono<Object> ProjectManagementController.deleteProjectById(id)
```

Delete Project

Delete Project By Id

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` | id of project |



### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: `application/problem+json`

<a id="readProjectById"></a>
# **readProjectById**
```java
Mono<Read> ProjectManagementController.readProjectById(id)
```

Get Project by id

Get Information about Project by id.

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` | id of project |

### Return type
[**Read**](../../docs/models/Read.md)


### HTTP request headers
 - **Accepts Content-Type**: Not defined
 - **Produces Content-Type**: `application/json`, `application/problem+json`

<a id="updateProjectById"></a>
# **updateProjectById**
```java
Mono<Read> ProjectManagementController.updateProjectById(idupdate)
```

Update Project

Update Project by its id

### Parameters
Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**id** | `UUID` | id of project |
**update** | [**Update**](../../docs/models/Update.md) | Representation of updated Project |

### Return type
[**Read**](../../docs/models/Read.md)


### HTTP request headers
 - **Accepts Content-Type**: `application/json`
 - **Produces Content-Type**: `application/json`, `application/problem+json`

