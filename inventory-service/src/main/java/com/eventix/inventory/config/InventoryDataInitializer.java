package com.eventix.inventory.config;

import com.eventix.inventory.entity.InventoryItem;
import com.eventix.inventory.repository.InventoryRepository;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InventoryDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(InventoryDataInitializer.class);

    @Bean
    public CommandLineRunner seedInventory(InventoryRepository inventoryRepository) {
        return args -> {
            if (inventoryRepository.count() > 0) {
                return;
            }
            log.info("Seeding initial inventory stock for all 40 products in Project Eventix...");

            List<InventoryItem> items = new ArrayList<>();

            // Electronics (10 items)
            items.add(new InventoryItem("prod-elec-01", "Sony WH-1000XM5 Wireless Headphones", 18, 0));
            items.add(new InventoryItem("prod-elec-02", "Bose QuietComfort Ultra Headphones", 14, 0));
            items.add(new InventoryItem("prod-elec-03", "Apple AirPods Max (USB-C Edition)", 9, 0));
            items.add(new InventoryItem("prod-elec-04", "Sony PlayStation 5 Pro Console", 6, 0));
            items.add(new InventoryItem("prod-elec-05", "Nintendo Switch OLED Model", 22, 0));
            items.add(new InventoryItem("prod-elec-06", "Sennheiser Momentum 4 Wireless", 16, 0));
            items.add(new InventoryItem("prod-elec-07", "DJI Mini 4 Pro Fly More Combo", 5, 0));
            items.add(new InventoryItem("prod-elec-08", "GoPro HERO12 Black Creator Edition", 12, 0));
            items.add(new InventoryItem("prod-elec-09", "Shure SM7B Vocal Dynamic Studio Mic", 15, 0));
            items.add(new InventoryItem("prod-elec-10", "Marshall Stanmore III Bluetooth Speaker", 11, 0));

            // Computing (10 items)
            items.add(new InventoryItem("prod-comp-01", "Apple MacBook Pro 16\" M3 Max", 7, 0));
            items.add(new InventoryItem("prod-comp-02", "Dell XPS 15 OLED InfinityEdge Laptop", 12, 0));
            items.add(new InventoryItem("prod-comp-03", "Samsung Odyssey OLED G9 Curved Gaming Monitor", 4, 0));
            items.add(new InventoryItem("prod-comp-04", "LG UltraFine 32\" 4K OLED Pro Display", 8, 0));
            items.add(new InventoryItem("prod-comp-05", "ASUS ROG Zephyrus G16 Gaming Laptop", 5, 0));
            items.add(new InventoryItem("prod-comp-06", "Lenovo ThinkPad X1 Carbon Gen 12", 14, 0));
            items.add(new InventoryItem("prod-comp-07", "Apple Mac Studio M2 Ultra Workstation", 3, 0));
            items.add(new InventoryItem("prod-comp-08", "Synology DiskStation DS923+ 4-Bay NAS", 18, 0));
            items.add(new InventoryItem("prod-comp-09", "Corsair One i500 Liquid-Cooled Desktop PC", 4, 0));
            items.add(new InventoryItem("prod-comp-10", "Microsoft Surface Laptop Studio 2", 9, 0));

            // Accessories (10 items)
            items.add(new InventoryItem("prod-acc-01", "Keychron Q1 Pro Mechanical Keyboard", 24, 0));
            items.add(new InventoryItem("prod-acc-02", "Logitech MX Master 3S Wireless Mouse", 42, 0));
            items.add(new InventoryItem("prod-acc-03", "Elgato Stream Deck XL Controller", 11, 0));
            items.add(new InventoryItem("prod-acc-04", "CalDigit TS4 Thunderbolt 4 18-Port Dock", 16, 0));
            items.add(new InventoryItem("prod-acc-05", "Anker 737 Power Bank (PowerCore 24K)", 35, 0));
            items.add(new InventoryItem("prod-acc-06", "Belkin BoostCharge Pro 3-in-1 MagSafe Charger", 28, 0));
            items.add(new InventoryItem("prod-acc-07", "Rode Wireless PRO Dual Microphone System", 13, 0));
            items.add(new InventoryItem("prod-acc-08", "BenQ ScreenBar Halo Monitor Light Bar", 20, 0));
            items.add(new InventoryItem("prod-acc-09", "Herman Miller Embody Precision Armrest Pads", 30, 0));
            items.add(new InventoryItem("prod-acc-10", "Peak Design Everyday Tech Pouch V2", 45, 0));

            // Smart Home (10 items)
            items.add(new InventoryItem("prod-smh-01", "Sonos Move 2 Portable Smart Speaker", 15, 0));
            items.add(new InventoryItem("prod-smh-02", "Philips Hue Play Gradient 65\" TV Lightstrip", 20, 0));
            items.add(new InventoryItem("prod-smh-03", "Apple HomePod (2nd Gen) Smart Speaker", 18, 0));
            items.add(new InventoryItem("prod-smh-04", "Google Nest Learning Thermostat (4th Gen)", 12, 0));
            items.add(new InventoryItem("prod-smh-05", "Roborock S8 Pro Ultra Robot Vacuum & Mop", 4, 0));
            items.add(new InventoryItem("prod-smh-06", "Ring Video Doorbell Pro 2", 25, 0));
            items.add(new InventoryItem("prod-smh-07", "Yale Assure Lock 2 Touch with Wi-Fi", 14, 0));
            items.add(new InventoryItem("prod-smh-08", "Nanoleaf Lines 60-Degree Smarter Kit (9 Lines)", 17, 0));
            items.add(new InventoryItem("prod-smh-09", "Ecobee Smart Thermostat Premium", 19, 0));
            items.add(new InventoryItem("prod-smh-10", "Aqara Smart Curtain Driver E1", 22, 0));

            inventoryRepository.saveAll(items);
            log.info("Finished seeding inventory stock for all 40 products.");
        };
    }
}
