/**
 * Observability & Telemetry Engine for AI Medical Companion (Phase 4)
 * Collects runtime health metrics, latency tracking, cache hits/misses, and safety stats.
 */

class ObservabilityManager {
    constructor() {
        this.metrics = {
            startTime: Date.now(),
            totalRequests: 0,
            totalErrors: 0,
            geminiApiCalls: 0,
            geminiFailures: 0,
            cacheHits: 0,
            cacheMisses: 0,
            emergencyInterceptions: 0,
            latenciesMs: [],
            qualityScores: []
        };
    }

    recordRequest(latencyMs, isError = false) {
        this.metrics.totalRequests++;
        if (isError) this.metrics.totalErrors++;
        if (latencyMs) {
            this.metrics.latenciesMs.push(latencyMs);
            if (this.metrics.latenciesMs.length > 500) {
                this.metrics.latenciesMs.shift();
            }
        }
    }

    recordGeminiCall(success = true) {
        this.metrics.geminiApiCalls++;
        if (!success) this.metrics.geminiFailures++;
    }

    recordCache(hit = true) {
        if (hit) this.metrics.cacheHits++;
        else this.metrics.cacheMisses++;
    }

    recordEmergency() {
        this.metrics.emergencyInterceptions++;
    }

    recordQualityScore(score = 1.0) {
        this.metrics.qualityScores.push(score);
        if (this.metrics.qualityScores.length > 500) {
            this.metrics.qualityScores.shift();
        }
    }

    getMetricsSnapshot() {
        const total = this.metrics.latenciesMs.length;
        const sumLatency = total > 0 ? this.metrics.latenciesMs.reduce((a, b) => a + b, 0) : 0;
        const avgLatency = total > 0 ? Math.round(sumLatency / total) : 0;

        const totalScores = this.metrics.qualityScores.length;
        const sumScore = totalScores > 0 ? this.metrics.qualityScores.reduce((a, b) => a + b, 0) : 0;
        const avgQuality = totalScores > 0 ? Number((sumScore / totalScores).toFixed(2)) : 1.0;

        const totalCache = this.metrics.cacheHits + this.metrics.cacheMisses;
        const cacheHitRate = totalCache > 0 ? Number(((this.metrics.cacheHits / totalCache) * 100).toFixed(1)) : 0;

        return {
            uptimeSeconds: Math.floor((Date.now() - this.metrics.startTime) / 1000),
            totalRequests: this.metrics.totalRequests,
            totalErrors: this.metrics.totalErrors,
            geminiApiCalls: this.metrics.geminiApiCalls,
            geminiFailures: this.metrics.geminiFailures,
            cacheHitRatePercent: `${cacheHitRate}%`,
            emergencyInterceptions: this.metrics.emergencyInterceptions,
            averageLatencyMs: avgLatency,
            averageQualityScore: avgQuality,
            status: this.metrics.totalErrors < 10 ? 'HEALTHY' : 'DEGRADED'
        };
    }
}

export const observability = new ObservabilityManager();
