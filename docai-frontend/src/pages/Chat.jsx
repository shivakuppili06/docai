import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { chatApi } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Chat() {
  useDocumentTitle("Chat Session");
  const { documentId } = useParams();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    chatApi.history(documentId).then(({ data }) => setMessages(data)).catch(() => {});
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    // Add optimistic user message
    const tempQuestion = question;
    setQuestion("");
    setLoading(true);
    
    try {
      const { data } = await chatApi.ask(Number(documentId), tempQuestion);
      setMessages((prev) => [...prev, data]);
    } catch {
      toast.error("Failed to get an answer. Please try again.");
      setQuestion(tempQuestion); // restore input
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container fade-in">
      <header className="chat-header">
        <div className="chat-header-inner">
          <Link to="/dashboard" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Dashboard
          </Link>
          <h2>Chat Session</h2>
        </div>
      </header>

      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px'}}>
            Start by asking a question about this document!
          </div>
        )}
        
        {messages.map((m) => {
          // Parse Java's map toString format if it's not valid JSON
          let sources = [];
          if (m.sourceCitations && m.sourceCitations !== "null" && m.sourceCitations !== "[]") {
            try {
              // Try parsing as JSON first
              sources = JSON.parse(m.sourceCitations);
            } catch {
              // Fallback for Java String.valueOf(List<Map>) which looks like [{chunk_index=1, text_snippet=...}]
              const rawStr = m.sourceCitations;
              const matches = rawStr.match(/text_snippet=([^}]+)}/g);
              if (matches) {
                sources = matches.map((m, i) => ({
                  chunk_index: i + 1,
                  text_snippet: m.replace('text_snippet=', '').replace('}', '').trim()
                }));
              }
            }
          }

          return (
            <div key={m.id} className="message-pair">
              {/* User Question */}
              <div className="chat-bubble bubble-user">
                {m.question}
              </div>
              
              {/* AI Answer */}
              <div className="chat-bubble bubble-ai">
                <div className="bubble-content">{m.answer}</div>
                
                {/* Action Bar */}
                <div className="bubble-actions">
                  <button 
                    onClick={() => navigator.clipboard.writeText(m.answer)}
                    className="btn-icon"
                    title="Copy Answer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
                
                {sources.length > 0 && (
                  <div className="citations-container">
                    <p className="citations-title">Sources</p>
                    <div className="citations-grid">
                      {sources.map((s, idx) => (
                        <details key={idx} className="source-card">
                          <summary>[{idx + 1}] Source Chunk {s.chunk_index || idx + 1}</summary>
                          <p>{s.text_snippet}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="message-pair">
            <div className="chat-bubble bubble-ai typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleAsk} className="chat-form">
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk(e);
              }
            }}
            placeholder="Ask a question about your document... (Shift+Enter for new line)"
            disabled={loading}
            autoFocus
            rows={1}
          />
          <button type="submit" className="btn-send" disabled={loading || !question.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
