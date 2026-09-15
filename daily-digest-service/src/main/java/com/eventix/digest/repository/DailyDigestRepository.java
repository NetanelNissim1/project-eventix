package com.eventix.digest.repository;

import com.eventix.digest.entity.DailyDigestRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailyDigestRepository extends JpaRepository<DailyDigestRecord, String> {
    Optional<DailyDigestRecord> findByReportDate(LocalDate date);
    List<DailyDigestRecord> findAllByOrderByReportDateDesc();
}
