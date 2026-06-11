package com.solarease.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solarease.dto.ClientRequest;
import com.solarease.service.AccessControlService;
import com.solarease.service.ClientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ClientController.class)
class ClientControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClientService clientService;

    @MockBean
    private AccessControlService accessControlService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createClient_Returns400WithFields_WhenEmailInvalid() throws Exception {
        ClientRequest request = ClientRequest.builder()
                .firstName("Jean")
                .lastName("Dupont")
                .email("not-an-email")
                .build();

        mockMvc.perform(post("/api/clients")
                        .header("X-User-Id", "installer-1")
                        .header("X-User-Role", "INSTALLER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists());
    }

    @Test
    void createClient_Returns400WithFields_WhenFirstNameTooShort() throws Exception {
        ClientRequest request = ClientRequest.builder()
                .firstName("J")
                .lastName("Dupont")
                .email("jean@example.com")
                .build();

        mockMvc.perform(post("/api/clients")
                        .header("X-User-Id", "installer-1")
                        .header("X-User-Role", "INSTALLER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.firstName").exists());
    }
}
