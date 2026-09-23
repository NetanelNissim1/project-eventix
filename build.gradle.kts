plugins {
    java
    jacoco
    id("org.springframework.boot") version "3.3.4" apply false
}

tasks.named<Test>("test") {
    enabled = false
}

allprojects {
    group = "com.eventix"
    version = "1.0.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "java")
    apply(plugin = "jacoco")

    configure<JacocoPluginExtension> {
        toolVersion = "0.8.12"
    }

    java {
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(21))
        }
    }

    dependencies {
        val springBootBom = platform("org.springframework.boot:spring-boot-dependencies:3.3.4")
        val springCloudBom = platform("org.springframework.cloud:spring-cloud-dependencies:2023.0.3")

        implementation(springBootBom)
        implementation(springCloudBom)

        compileOnly(springBootBom)
        annotationProcessor(springBootBom)

        compileOnly("org.projectlombok:lombok")
        annotationProcessor("org.projectlombok:lombok")

        testImplementation(springBootBom)
        testImplementation("org.springframework.boot:spring-boot-starter-test")
    }

    tasks.withType<Test> {
        useJUnitPlatform()
        finalizedBy(tasks.withType<JacocoReport>())
    }

    tasks.withType<JacocoReport> {
        dependsOn(tasks.withType<Test>())
        reports {
            xml.required.set(true)
            html.required.set(true)
            csv.required.set(false)
        }
    }
}

tasks.register<JacocoReport>("jacocoRootReport") {
    description = "Generates an aggregated code coverage report for all subprojects"
    group = "Verification"

    val subprojectsWithJava = subprojects.filter { it.plugins.hasPlugin("java") }
    dependsOn(subprojectsWithJava.map { it.tasks.withType<Test>() })

    additionalSourceDirs.setFrom(subprojectsWithJava.map { it.the<SourceSetContainer>()["main"].allSource.srcDirs })
    sourceDirectories.setFrom(subprojectsWithJava.map { it.the<SourceSetContainer>()["main"].allSource.srcDirs })
    classDirectories.setFrom(subprojectsWithJava.map { it.the<SourceSetContainer>()["main"].output })
    executionData.setFrom(files(subprojectsWithJava.map { it.layout.buildDirectory.file("jacoco/test.exec") }))

    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
        xml.outputLocation.set(layout.buildDirectory.file("reports/jacoco/jacocoRootReport/jacocoRootReport.xml"))
        html.outputLocation.set(layout.buildDirectory.dir("reports/jacoco/jacocoRootReport/html"))
    }
}
