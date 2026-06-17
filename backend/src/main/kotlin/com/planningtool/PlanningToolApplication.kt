package com.planningtool

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class PlanningToolApplication

fun main(args: Array<String>) {
	runApplication<PlanningToolApplication>(*args)
}
