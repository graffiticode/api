'use strict';

const { LogLevel } = require('@opentelemetry/core');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor, ConsoleSpanExporter, InMemorySpanExporter } = require('@opentelemetry/tracing');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');

const exporterType = process.env.OTEL_EXPORTER_TYPE || 'in-memory';

let exporter;
if (exporterType === 'google-cloud') {
  exporter = new TraceExporter();
} else if (exporterType === 'console') {
  exporter = new ConsoleSpanExporter();
} else if (exporterType === 'in-memory') {
  exporter = new InMemorySpanExporter();
} else {
  console.log(`Unknown open telemetry exporter type: '${exporterType}'`);
  exporter = new InMemorySpanExporter();
}

const provider = new NodeTracerProvider({ logLevel: LogLevel.ERROR });
provider.register();
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

console.log('tracing initialized');
