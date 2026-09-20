package com.eventix.digest.dto;

import java.time.Instant;

public class DigestScheduleConfig {

    private String scheduleType = "RECURRING"; // "RECURRING", "ONE_OFF", "DISABLED"
    private String recurringFrequency = "DAILY"; // "DAILY", "WEEKLY"
    private int targetHour = 23;
    private int targetMinute = 0;
    private String targetDayOfWeek = "ALL"; // "ALL", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"
    private String oneOffDateTime; // e.g. "2026-09-22T20:30"
    private String recipient = "bill.nissim@gmail.com";
    private boolean active = true;
    private Instant lastRun;
    private String nextRunDescription;

    public DigestScheduleConfig() {}

    public DigestScheduleConfig(String scheduleType, String recurringFrequency, int targetHour, int targetMinute,
                                String targetDayOfWeek, String oneOffDateTime, String recipient, boolean active) {
        this.scheduleType = scheduleType;
        this.recurringFrequency = recurringFrequency;
        this.targetHour = targetHour;
        this.targetMinute = targetMinute;
        this.targetDayOfWeek = targetDayOfWeek;
        this.oneOffDateTime = oneOffDateTime;
        this.recipient = recipient;
        this.active = active;
    }

    public String getScheduleType() { return scheduleType; }
    public void setScheduleType(String scheduleType) { this.scheduleType = scheduleType; }

    public String getRecurringFrequency() { return recurringFrequency; }
    public void setRecurringFrequency(String recurringFrequency) { this.recurringFrequency = recurringFrequency; }

    public int getTargetHour() { return targetHour; }
    public void setTargetHour(int targetHour) { this.targetHour = targetHour; }

    public int getTargetMinute() { return targetMinute; }
    public void setTargetMinute(int targetMinute) { this.targetMinute = targetMinute; }

    public String getTargetDayOfWeek() { return targetDayOfWeek; }
    public void setTargetDayOfWeek(String targetDayOfWeek) { this.targetDayOfWeek = targetDayOfWeek; }

    public String getOneOffDateTime() { return oneOffDateTime; }
    public void setOneOffDateTime(String oneOffDateTime) { this.oneOffDateTime = oneOffDateTime; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getLastRun() { return lastRun; }
    public void setLastRun(Instant lastRun) { this.lastRun = lastRun; }

    public String getNextRunDescription() { return nextRunDescription; }
    public void setNextRunDescription(String nextRunDescription) { this.nextRunDescription = nextRunDescription; }
}
