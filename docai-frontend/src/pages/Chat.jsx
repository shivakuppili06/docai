import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatApi, documentApi } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Chat() {
  useDocumentTitle("Chat Session");
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  const suggestedQuestions = [
    "Summarize this document in 3 bullet points.",
    "What are the key findings or main concepts?",
    "What is the methodology used here?",
    "What are the most important conclusions?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Fetch document metadata to show on the left panel
    documentApi.list().then(({ data }) => {
      const doc = data.find(d => d.id === Number(documentId));
      if (doc) setDocument(doc);
    }).catch(() => {});

    chatApi.history(documentId).then(({ data }) => setMessages(data)).catch(() => {});
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const submitQuestion = async (text) => {
    if (!text.trim()) return;
    
    // Add optimistic user message
    const tempQuestion = text;
    setQuestion("");
    setLoading(true);
    
    // Optimistically add user message to UI
    const optimisticMsg = { id: Date.now(), question: tempQuestion, answer: null };
    setMessages((prev) => [...prev, optimisticMsg]);
    
    try {
      const { data } = await chatApi.ask(Number(documentId), tempQuestion);
      // Replace optimistic message with real one
      setMessages((prev) => prev.map(m => m.id === optimisticMsg.id ? data : m));
    } catch {
      toast.error("Failed to get an answer. Please try again.");
      setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id));
      setQuestion(tempQuestion); // restore input
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = (e) => {
    e.preventDefault();
    submitQuestion(question);
  };

  return (
    <div className="chat-page fade-in">
      {/* Left Panel: Metadata & Suggestions */}
      <div className="chat-left-panel">
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontWeight: '500' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </button>

        <div className="chat-doc-preview">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h2>{document ? document.fileName : "Loading Document..."}</h2>
          <span className="badge indexed" style={{ marginTop: '8px' }}>INDEXED</span>
          <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Document preview is currently unavailable. You can chat with the extracted text on the right.
          </p>
        </div>

        {messages.length === 0 && (
          <div className="suggested-questions">
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Suggested Questions</h3>
            {suggestedQuestions.map((q, idx) => (
              <button 
                key={idx} 
                className="suggested-q-btn" 
                onClick={() => submitQuestion(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="chat-right-panel">
        <div className="chat-messages">
          {messages.length === 0 && !loading && (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--primary)', marginBottom: '16px' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h2>Ask anything about your document</h2>
              <p>DocAI uses advanced retrieval-augmented generation to answer questions based entirely on your uploaded file.</p>
            </div>
          )}
          
          {messages.map((m) => {
            // Optimistic message doesn't have an answer yet
            if (m.answer === null) {
              return (
                <div key={m.id} className="message-pair">
                  <div className="bubble bubble-user">{m.question}</div>
                </div>
              );
            }

            // Parse Java's map toString format
            let sources = [];
            if (m.sourceCitations && m.sourceCitations !== "null" && m.sourceCitations !== "[]") {
              try {
                sources = JSON.parse(m.sourceCitations);
              } catch {
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
                <div className="bubble bubble-user">
                  {m.question}
                </div>
                
                {/* AI Answer */}
                <div className="bubble bubble-ai">
                  <div style={{ whiteSpace: 'pre-line' }}>{m.answer}</div>
                  
                  {/* Action Bar */}
                  <div className="bubble-actions">
                    <button 
                      onClick={() => navigator.clipboard.writeText(m.answer)}
                      className="icon-btn"
                      title="Copy Answer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                  
                  {/* Citations */}
                  {sources.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <p className="citations-title">Retrieved Evidence</p>
                      <div className="citations-grid">
                        {sources.map((s, idx) => (
                          <div key={idx} className="citation-card">
                            <strong>Source Segment {s.chunk_index || idx + 1}</strong>
                            <p>"{s.text_snippet}"</p>
                          </div>
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
              <div className="bubble bubble-ai typing-indicator" style={{ width: 'auto' }}>
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: 1 }} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <form onSubmit={handleAsk} className="chat-form">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitQuestion(question);
                }
              }}
              placeholder="Message DocAI..."
              disabled={loading}
              autoFocus
              rows={1}
            />
            <button type="submit" className="btn-send" disabled={loading || !question.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            DocAI can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}
