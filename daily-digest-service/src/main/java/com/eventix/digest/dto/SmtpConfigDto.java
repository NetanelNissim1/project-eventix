package com.eventix.digest.dto;

public class SmtpConfigDto {
    private String host;
    private int port;
    private String username;
    private String password;
    private boolean auth;
    private boolean starttls;
    private boolean configured;

    public SmtpConfigDto() {}

    public SmtpConfigDto(String host, int port, String username, String password, boolean auth, boolean starttls, boolean configured) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.auth = auth;
        this.starttls = starttls;
        this.configured = configured;
    }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isAuth() { return auth; }
    public void setAuth(boolean auth) { this.auth = auth; }

    public boolean isStarttls() { return starttls; }
    public void setStarttls(boolean starttls) { this.starttls = starttls; }

    public boolean isConfigured() { return configured; }
    public void setConfigured(boolean configured) { this.configured = configured; }
}
