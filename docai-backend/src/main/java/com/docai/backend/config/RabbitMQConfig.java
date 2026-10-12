package com.docai.backend.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String DOCUMENT_PROCESSING_QUEUE = "document.processing.queue";
    public static final String DLQ = "document.processing.dlq";
    public static final String DLX = "document.dlx";

    @Bean
    public org.springframework.amqp.core.DirectExchange dlx() {
        return new org.springframework.amqp.core.DirectExchange(DLX);
    }

    @Bean
    public Queue dlq() {
        return new Queue(DLQ, true);
    }

    @Bean
    public org.springframework.amqp.core.Binding dlqBinding() {
        return org.springframework.amqp.core.BindingBuilder.bind(dlq()).to(dlx()).with("document.processing.dlq");
    }

    @Bean
    public Queue documentProcessingQueue() {
        return org.springframework.amqp.core.QueueBuilder.durable(DOCUMENT_PROCESSING_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", "document.processing.dlq")
                .build();
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
