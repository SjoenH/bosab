import './style.css'
import * as THREE from 'three'
import { AudioAnalyzer } from './audio/AudioAnalyzer'
import { SceneManager } from './scenes/SceneManager'
import { PerformanceApp } from './PerformanceApp'

// Initialize the performance application
const app = new PerformanceApp()
app.init()
