package com.kaundega.backend.dto;
import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;
@Data
@Builder
public class GroupDto {
    private UUID id;
    private String name;
    private UUID createdBy;
    private List<UserDto> members;
}
