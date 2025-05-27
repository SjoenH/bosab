import "./style.css";
import * as THREE from "three";
import { PerformanceApp } from "./PerformanceApp";
import { AudioAnalyzer } from "./audio/AudioAnalyzer";
import { SceneManager } from "./scenes/SceneManager";

// Initialize the performance application
const app = new PerformanceApp();
app.init();
