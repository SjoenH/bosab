import './style.css'
import * as THREE from 'three'
import { AudioAnalyzer } from './audio/AudioAnalyzer.js'
import { SceneManager } from './scenes/SceneManager.js'
import { PerformanceApp } from './PerformanceApp.js'

// Initialize the performance application
const app = new PerformanceApp()
app.init()
