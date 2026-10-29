package com.racksy.warehouse.inventory;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContainerRepository extends JpaRepository<InventoryContainer, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select container from InventoryContainer container where container.shelfId = :shelfId")
    Optional<InventoryContainer> findForUpdate(@Param("shelfId") String shelfId);
}
