import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi, documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { Send, ArrowLeft, Bot, User, HelpCircle } from 'lucide-react';

const Chat = () => {
  const { documentId } = useParams();
  const [doc, setDoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const endOfMessagesRef = useRef(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, historyRes] = await Promise.all([
          documentApi.list(),
          chatApi.history(documentId)
        ]);
        
        const found = docsRes.data.find(d => d.id.toString() === documentId);
        if (!found) {
          toast('Document not found', 'error');
          navigate('/documents');
          return;
        }
        setDoc(found);
        setHistory(historyRes.data);
      } catch (err) {
        toast('Failed to load chat history', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [documentId, navigate, toast]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, sending]);

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;

    const currentQ = question.trim();
    setQuestion('');
    setSending(true);

    try {
      const res = await chatApi.ask(documentId, currentQ);
      setHistory(prev => [...prev, res.data]);
    } catch (err) {
      toast('Failed to get answer', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // Parse citations string safely
  const parseCitations = (citationsStr) => {
    if (!citationsStr) return [];
    try {
      // The backend returns a string representation of a map/list. It might be valid JSON if lucky.
      // E.g. "[{chunk_index: 1, text: '...'}, ...]" but if it's Java's toString, it might be weird.
      // We'll try JSON parse, but degrade gracefully.
      const parsed = JSON.parse(citationsStr);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      // If it's not JSON, just return a single fallback object
      return [{ chunk_index: 'N/A', text: citationsStr }];
    }
  };

  const suggestedQuestions = [
    "What is the main topic of this document?",
    "Summarize the key points.",
    "What are the action items?"
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <Skeleton height="40px" width="200px" />
        <Skeleton height="60vh" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      <div className="flex items-center gap-4 mb-4" style={{ paddingBottom: '1rem', borderBottom: 'var(--border-thin)' }}>
        <Button variant="ghost" onClick={() => navigate(`/documents/${documentId}`)} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{doc?.fileName}</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>DocAI Assistant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
        {history.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }}>
              <Bot size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>How can I help you today?</h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', marginBottom: '2rem' }}>
              Ask any question about your document. I will search the indexed content and provide a cited answer.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {suggestedQuestions.map((sq, i) => (
                <button 
                  key={i} 
                  onClick={() => setQuestion(sq)}
                  style={{ 
                    padding: '0.5rem 1rem', backgroundColor: 'var(--color-bg)', border: 'var(--border-thin)', 
                    borderRadius: 'var(--radius-full)', fontSize: '0.875rem', color: 'var(--color-text-dark)',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((msg, index) => {
            const citations = parseCitations(msg.sourceCitations);
            return (
              <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* User Message */}
                <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-end', maxWidth: '80%' }}>
                  <div style={{ 
                    padding: '1rem 1.25rem', backgroundColor: 'var(--color-primary)', color: '#fff', 
                    borderRadius: '1.5rem', borderBottomRightRadius: '0.25rem', whiteSpace: 'pre-wrap'
                  }}>
                    {msg.question}
                  </div>
                  <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} />
                  </div>
                </div>

                {/* AI Message */}
                <div style={{ display: 'flex', gap: '1rem', maxWidth: '90%' }}>
                  <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ 
                      padding: '1rem 1.25rem', backgroundColor: 'var(--color-card)', border: 'var(--border-thin)', 
                      borderRadius: '1.5rem', borderBottomLeftRadius: '0.25rem', whiteSpace: 'pre-wrap', lineHeight: '1.6'
                    }}>
                      {msg.answer}
                    </div>
                    {citations.length > 0 && citations[0].text !== 'null' && (
                      <div style={{ paddingLeft: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <HelpCircle size={14} /> Sources Context
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {citations.map((cite, i) => (
                            <div key={i} style={{ fontSize: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: 'var(--border-thin)' }}>
                              <span style={{ fontWeight: '600', color: 'var(--color-primary)', display: 'block', marginBottom: '0.25rem' }}>
                                Chunk {cite.chunk_index || (i+1)}
                              </span>
                              <span style={{ color: 'var(--color-text-secondary)' }}>{cite.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {sending && (
          <div style={{ display: 'flex', gap: '1rem', maxWidth: '90%' }}>
            <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} />
            </div>
            <div style={{ 
              padding: '1rem 1.25rem', backgroundColor: 'var(--color-card)', border: 'var(--border-thin)', 
              borderRadius: '1.5rem', borderBottomLeftRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <style>{`
                .dot-typing { animation: typing 1.4s infinite ease-in-out both; width: 6px; height: 6px; background-color: var(--color-text-secondary); border-radius: 50%; }
                .dot-typing:nth-child(1) { animation-delay: -0.32s; }
                .dot-typing:nth-child(2) { animation-delay: -0.16s; }
                @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
              `}</style>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500', marginRight: '0.25rem' }}>Thinking</span>
              <div className="dot-typing" />
              <div className="dot-typing" />
              <div className="dot-typing" />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div style={{ padding: '1rem 0', marginTop: 'auto' }}>
        <form onSubmit={handleAsk} style={{ position: 'relative' }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the document... (Shift+Enter for newline)"
            style={{
              width: '100%', padding: '1rem 4rem 1rem 1rem', borderRadius: 'var(--radius-lg)',
              border: 'var(--border-thin)', backgroundColor: 'var(--color-card)',
              fontFamily: 'var(--font-family)', fontSize: '1rem', resize: 'none',
              minHeight: '60px', maxHeight: '200px', outline: 'none',
              boxShadow: 'var(--shadow-sm)', transition: 'border-color var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            rows={1}
            disabled={sending}
          />
          <Button 
            type="submit" 
            disabled={!question.trim() || sending}
            style={{ 
              position: 'absolute', right: '0.75rem', bottom: '0.75rem',
              width: '40px', height: '40px', padding: 0, borderRadius: '50%' 
            }}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
