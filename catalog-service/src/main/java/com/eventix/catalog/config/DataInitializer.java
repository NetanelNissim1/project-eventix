package com.eventix.catalog.config;

import com.eventix.catalog.entity.CategoryEntity;
import com.eventix.catalog.entity.ProductEntity;
import com.eventix.catalog.repository.CategoryRepository;
import com.eventix.catalog.repository.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner seedCatalog(ProductRepository productRepo, CategoryRepository categoryRepo) {
        return args -> {
            if (productRepo.count() > 0) {
                return;
            }
            log.info("Seeding comprehensive catalog categories and 40 products (10 per category)...");

            CategoryEntity electronics = categoryRepo.save(new CategoryEntity("cat-electronics", "Electronics", "Cutting-edge gadgets & premium audio equipment"));
            CategoryEntity computing = categoryRepo.save(new CategoryEntity("cat-computing", "Computing", "High-performance laptops, workstations & displays"));
            CategoryEntity accessories = categoryRepo.save(new CategoryEntity("cat-accessories", "Accessories", "Peripherals, mechanical keyboards & docks"));
            CategoryEntity smartHome = categoryRepo.save(new CategoryEntity("cat-smart-home", "Smart Home", "Intelligent automation, lighting & IoT ecosystems"));

            List<ProductEntity> products = new ArrayList<>();

            // ==========================================
            // CATEGORY 1: ELECTRONICS (10 Products)
            // ==========================================
            products.add(new ProductEntity("prod-elec-01", "Sony WH-1000XM5 Wireless Headphones",
                "Industry-leading noise canceling headphones with dual processors and 8 microphones.",
                new BigDecimal("349.99"), "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-02", "Bose QuietComfort Ultra Headphones",
                "Breakthrough spatialized audio with custom-tuned active noise cancellation.",
                new BigDecimal("429.00"), "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-03", "Apple AirPods Max (USB-C Edition)",
                "Computational audio with custom acoustic design and Active Noise Cancellation.",
                new BigDecimal("549.00"), "https://images.unsplash.com/photo-1628202926206-c63a34b1618f?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-04", "Sony PlayStation 5 Pro Console",
                "Next-generation 4K 120Hz console gaming with advanced Ray Tracing and 2TB SSD.",
                new BigDecimal("699.99"), "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-05", "Nintendo Switch OLED Model",
                "Vibrant 7-inch OLED screen, wide adjustable stand, and wired LAN dock.",
                new BigDecimal("349.99"), "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-06", "Sennheiser Momentum 4 Wireless",
                "Audiophile-inspired 42mm transducer system delivering 60-hour battery life.",
                new BigDecimal("299.95"), "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-07", "DJI Mini 4 Pro Fly More Combo",
                "Ultralight sub-249g camera drone with omnidirectional obstacle sensing.",
                new BigDecimal("959.00"), "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-08", "GoPro HERO12 Black Creator Edition",
                "Flagship waterproof action camera with HDR 5.3K video and HyperSmooth 6.0.",
                new BigDecimal("399.99"), "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-09", "Shure SM7B Vocal Dynamic Studio Mic",
                "Legendary broadcast-quality cardioid dynamic microphone with electromagnetic shielding.",
                new BigDecimal("399.00"), "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=85", electronics, Instant.now()));

            products.add(new ProductEntity("prod-elec-10", "Marshall Stanmore III Bluetooth Speaker",
                "Legendary vintage design re-engineered with wider stereo soundstage and analog warmth.",
                new BigDecimal("379.99"), "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=85", electronics, Instant.now()));

            // ==========================================
            // CATEGORY 2: COMPUTING (10 Products)
            // ==========================================
            products.add(new ProductEntity("prod-comp-01", "Apple MacBook Pro 16\" M3 Max",
                "Supercharged with M3 Max chip, 36GB Unified Memory, and Liquid Retina XDR display.",
                new BigDecimal("2999.00"), "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-02", "Dell XPS 15 OLED InfinityEdge Laptop",
                "Intel Core i9 14-core processor, RTX 4070, and 3.5K OLED touchscreen display.",
                new BigDecimal("1899.00"), "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-03", "Samsung Odyssey OLED G9 Gaming Monitor",
                "49-inch curved dual QHD (5120x1440) OLED display with 240Hz refresh rate.",
                new BigDecimal("1399.99"), "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-04", "LG UltraFine 32\" 4K OLED Pro Display",
                "Reference-grade 32-inch 4K OLED panel with 1,000,000:1 contrast and 99% DCI-P3.",
                new BigDecimal("1299.99"), "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-05", "ASUS ROG Zephyrus G16 Gaming Laptop",
                "Intel Core Ultra 9, RTX 4080 Laptop GPU, and ROG Nebula OLED 240Hz display.",
                new BigDecimal("2199.99"), "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-06", "Lenovo ThinkPad X1 Carbon Gen 12",
                "Enterprise business ultrabook with Intel Core Ultra 7 vPro and carbon fiber frame.",
                new BigDecimal("1649.00"), "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-07", "Apple Mac Studio M2 Ultra Workstation",
                "Monstrous desktop performance with 24-core CPU, 60-core GPU, and 64GB unified memory.",
                new BigDecimal("3999.00"), "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-08", "Synology DiskStation DS923+ 4-Bay NAS",
                "Centralized private cloud storage and backup solution with quad-core AMD Ryzen CPU.",
                new BigDecimal("599.99"), "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-09", "Corsair One i500 Liquid-Cooled Desktop",
                "Compact mini-ITX workstation with Intel Core i9-14900K and liquid-cooled RTX 4080.",
                new BigDecimal("3599.99"), "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=85", computing, Instant.now()));

            products.add(new ProductEntity("prod-comp-10", "Microsoft Surface Laptop Studio 2",
                "Dynamic woven hinge transitioning to canvas mode with 14.4\" PixelSense 120Hz display.",
                new BigDecimal("2399.99"), "https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=800&q=85", computing, Instant.now()));

            // ==========================================
            // CATEGORY 3: ACCESSORIES (10 Products)
            // ==========================================
            products.add(new ProductEntity("prod-acc-01", "Keychron Q1 Pro Mechanical Keyboard",
                "Wireless custom mechanical keyboard with CNC aluminum body and hot-swappable switches.",
                new BigDecimal("199.00"), "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-02", "Logitech MX Master 3S Wireless Mouse",
                "Quiet clicks, 8K DPI tracking on glass, and ergonomic sculpted design.",
                new BigDecimal("99.99"), "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-03", "Elgato Stream Deck XL Controller",
                "32 customizable LCD keys to trigger unlimited studio workflows with one touch.",
                new BigDecimal("249.99"), "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-04", "CalDigit TS4 Thunderbolt 4 Dock",
                "18 versatile ports, 98W Power Delivery to charge your laptop, and 2.5GbE Ethernet.",
                new BigDecimal("399.95"), "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-05", "Anker 737 Power Bank (PowerCore 24K)",
                "Ultra-powerful 140W two-way fast charging with 24,000mAh capacity and digital screen.",
                new BigDecimal("149.99"), "https://images.unsplash.com/photo-1609592424360-1e5b565a4e76?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-06", "Belkin BoostCharge Pro 3-in-1 Charger",
                "Fast wireless charging pad for iPhone, Apple Watch, and AirPods with MagSafe.",
                new BigDecimal("149.95"), "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-07", "Rode Wireless PRO Dual Microphone",
                "Compact dual-channel wireless microphone with 32-bit float on-board recording.",
                new BigDecimal("399.00"), "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-08", "BenQ ScreenBar Halo Monitor Light Bar",
                "Glare-free monitor light bar with wireless rotary controller and ambient backlighting.",
                new BigDecimal("179.00"), "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-09", "Herman Miller Embody Armrest Pads",
                "High-density memory foam cooling gel arm pads engineered for the Embody chair.",
                new BigDecimal("89.00"), "https://images.unsplash.com/photo-1580481077163-91b702ec2bb8?w=800&q=85", accessories, Instant.now()));

            products.add(new ProductEntity("prod-acc-10", "Peak Design Everyday Tech Pouch V2",
                "Origami-style internal pocket organization with weatherproof recycled nylon canvas.",
                new BigDecimal("64.95"), "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85", accessories, Instant.now()));

            // ==========================================
            // CATEGORY 4: SMART HOME (10 Products)
            // ==========================================
            products.add(new ProductEntity("prod-smh-01", "Sonos Move 2 Portable Smart Speaker",
                "Room-filling stereo sound with dual tweeters, 24 hours battery life, and IP56.",
                new BigDecimal("449.00"), "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-02", "Philips Hue Play Gradient TV Lightstrip",
                "Smart surround lighting that reacts in real-time to your screen movies and games.",
                new BigDecimal("229.99"), "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-03", "Apple HomePod (2nd Gen) Smart Speaker",
                "High-fidelity audio with Room sensing technology, Spatial Audio, and Matter hub.",
                new BigDecimal("299.00"), "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-04", "Google Nest Learning Thermostat 4th Gen",
                "Curved polished glass display with AI energy-saving temperature scheduling.",
                new BigDecimal("279.99"), "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-05", "Roborock S8 Pro Ultra Robot Vacuum",
                "RockDock Ultra with self-washing, self-drying, self-emptying, and 6,000Pa suction.",
                new BigDecimal("1199.99"), "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-06", "Ring Video Doorbell Pro 2",
                "Premium wired video doorbell with Head-to-Toe 1536p HD Video and 3D Motion Detection.",
                new BigDecimal("249.99"), "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-07", "Yale Assure Lock 2 Touch with Wi-Fi",
                "Keyless smart deadbolt with biometric fingerprint sensor and Apple HomeKit support.",
                new BigDecimal("279.99"), "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-08", "Nanoleaf Lines 60-Degree Smarter Kit",
                "Modular backlit smart LED light bars with dynamic color animations and rhythm sync.",
                new BigDecimal("199.99"), "https://images.unsplash.com/photo-1507499739999-097706ad8914?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-09", "Ecobee Smart Thermostat Premium",
                "Smart thermostat with built-in air quality monitor and included SmartSensor.",
                new BigDecimal("249.99"), "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800&q=85", smartHome, Instant.now()));

            products.add(new ProductEntity("prod-smh-10", "Aqara Smart Curtain Driver E1",
                "Motorized smart curtain driver with custom schedules, light sensor, and Zigbee 3.0.",
                new BigDecimal("99.99"), "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=85", smartHome, Instant.now()));

            productRepo.saveAll(products);
            log.info("Finished seeding 40 catalog products across all 4 categories.");
        };
    }
}
