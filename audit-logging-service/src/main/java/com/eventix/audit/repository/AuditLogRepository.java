package com.eventix.audit.repository;

import com.eventix.audit.entity.AuditLogEntity;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, String> {

    Page<AuditLogEntity> findByLevelOrderByTimestampDesc(String level, Pageable pageable);

    Page<AuditLogEntity> findByServiceNameOrderByTimestampDesc(String serviceName, Pageable pageable);

    List<AuditLogEntity> findByTimestampBetweenOrderByTimestampDesc(Instant start, Instant end);

    long countByLevel(String level);

    long countByTimestampBetween(Instant start, Instant end);

    @Query("SELECT a.level, COUNT(a) FROM AuditLogEntity a GROUP BY a.level")
    List<Object[]> countGroupedByLevel();
}
