/*
 * Webcorc
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

package edu.kit.cbc.web.model;

import java.util.Objects;
import java.util.Arrays;
import java.util.Optional;
import edu.kit.cbc.web.model.DirectoryAllOfContent;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.io.Serializable;
import com.fasterxml.jackson.annotation.*;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import io.micronaut.core.annotation.*;
import jakarta.annotation.Generated;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Directory
 */
@Schema(name = "directory", description = "Directory")
@io.micronaut.serde.annotation.Serdeable
@Generated(value="org.openapitools.codegen.languages.JavaMicronautServerCodegen", comments = "Generator version: 7.8.0-SNAPSHOT")
@Introspected
public class Directory implements Serializable {
    private static final long serialVersionUID = 1L;

    public static final String JSON_PROPERTY_URN = "urn";
    private String urn;

    public static final String JSON_PROPERTY_INODE_TYPE = "inodeType";
    private String inodeType;

    public static final String JSON_PROPERTY_CONTENT = "content";
    private List<DirectoryAllOfContent> content = new ArrayList<>();

    public Directory(String urn, String inodeType, List<DirectoryAllOfContent> content) {
        this.urn = urn;
        this.inodeType = inodeType;
        this.content = content;
    }

    public Directory urn(String urn) {
        this.urn = urn;
        return this;
    }

    /**
     * Get urn
     * @return urn
     */
    @NotNull
    @Schema(name = "urn", requiredMode = Schema.RequiredMode.REQUIRED)
    public String getUrn() {
        return urn;
    }

    public void setUrn(String urn) {
        this.urn = urn;
    }

    public Directory inodeType(String inodeType) {
        this.inodeType = inodeType;
        return this;
    }

    /**
     * Get inodeType
     * @return inodeType
     */
    @NotNull
    @Schema(name = "inodeType", requiredMode = Schema.RequiredMode.REQUIRED)
    public String getInodeType() {
        return inodeType;
    }

    public void setInodeType(String inodeType) {
        this.inodeType = inodeType;
    }

    public Directory content(List<DirectoryAllOfContent> content) {
        this.content = content;
        return this;
    }

    public Directory addContentItem(DirectoryAllOfContent contentItem) {
        this.content.add(contentItem);
        return this;
    }

    /**
     * Get content
     * @return content
     */
    @NotNull
    @Schema(name = "content", requiredMode = Schema.RequiredMode.REQUIRED)
    public List<DirectoryAllOfContent> getContent() {
        return content;
    }

    public void setContent(List<DirectoryAllOfContent> content) {
        this.content = content;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Directory directory = (Directory) o;
        return Objects.equals(this.urn, directory.urn) &&
            Objects.equals(this.inodeType, directory.inodeType) &&
            Objects.equals(this.content, directory.content);
    }

    @Override
    public int hashCode() {
        return Objects.hash(urn, inodeType, content);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("class Directory {\n");
        sb.append("    urn: ").append(toIndentedString(urn)).append("\n");
        sb.append("    inodeType: ").append(toIndentedString(inodeType)).append("\n");
        sb.append("    content: ").append(toIndentedString(content)).append("\n");
        sb.append("}");
        return sb.toString();
    }

    /**
     * Convert the given object to string with each line indented by 4 spaces
     * (except the first line).
     */
    private String toIndentedString(Object o) {
        if (o == null) {
            return "null";
        }
        return o.toString().replace("\n", "\n    ");
    }

}

