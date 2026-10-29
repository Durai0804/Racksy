package com.racksy.warehouse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.racksy.warehouse.inventory.ContainerRepository;
import com.racksy.warehouse.movement.StockMovementRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class WarehouseApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ContainerRepository containerRepository;
    @Autowired StockMovementRepository movementRepository;

    @Test
    void seedsFifteenContainersAndReturnsCalculatedOccupancy() throws Exception {
        mvc.perform(get("/api/warehouse/containers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(15))
                .andExpect(jsonPath("$[0].shelfId").value("A-01-L1"))
                .andExpect(jsonPath("$[0].product.sku").value("WM-001"))
                .andExpect(jsonPath("$[0].occupancyPercentage").value(25.0))
                .andExpect(jsonPath("$[0].availableCapacity").value(75));
    }

    @Test
    void successfulStockChangePersistsAndAddsMovement() throws Exception {
        long movementCount = movementRepository.count();
        mvc.perform(post("/api/warehouse/containers/A-01-L1/stock/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":5,\"note\":\"integration test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStock").value(30))
                .andExpect(jsonPath("$.occupancyPercentage").value(30.0))
                .andExpect(jsonPath("$.availableCapacity").value(70));

        assertThat(containerRepository.findById("A-01-L1").orElseThrow().getCurrentStock()).isEqualTo(30);
        assertThat(movementRepository.count()).isEqualTo(movementCount + 1);
    }

    @Test
    void rejectsOverCapacityAndInsufficientRemoval() throws Exception {
        mvc.perform(post("/api/warehouse/containers/A-01-L1/stock/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":76,\"note\":\"too much\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/warehouse/containers/A-01-L1/stock/remove")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":26,\"note\":\"too much\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsZeroAndNegativeQuantities() throws Exception {
        mvc.perform(post("/api/warehouse/containers/A-01-L1/stock/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":0,\"note\":\"invalid\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }
}
