import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { chatApi, documentApi, AskResponse } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Send, ArrowLeft, Bot, User, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Document } from '@/types';
import { useChatStore } from '../hooks/useChatStore';

const SourcesPanel = ({ citations }: { citations: any[] }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!citations || citations.length === 0 || (citations.length === 1 && citations[0].text === 'null')) {
    return null;
  }

  return (
    <div className="sources-panel">
      <div className="sources-header" onClick={() => setExpanded(!expanded)}>
        <span>Sources ({citations.length})</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {expanded && (
        <div className="sources-content">
          {citations.map((cite, i) => {
            const isTruncated = cite.text && cite.text.length > 150;
            return (
              <div key={i} className="source-card">
                <span className="source-meta">
                  <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Source {cite.chunk_index || (i+1)}
                </span>
                <div className="source-text">
                  {isTruncated ? (
                    <>
                      {cite.text.substring(0, 150)}...
                      <span 
                        style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: '4px', fontWeight: '500' }}
                        onClick={(e: any) => {
                          e.target.parentElement.innerHTML = cite.text; // Simple expand inline
                        }}
                      >
                        Show more
                      </span>
                    </>
                  ) : (
                    cite.text
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const { documentId } = useParams({ strict: false }) as any;
  const [question, setQuestion] = useState('');
  
  const { 
    doc, history, loading, sending, 
    setDoc, setHistory, setLoading, setSending, 
    addMessage, removeMessage, updateMessageText, updateMessageSources 
  } = useChatStore();
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast() as any;
  const navigate = useNavigate();

  useEffect(() => {
    // Reset store state whenever the documentId changes
    setDoc(null);
    setHistory([]);
    setLoading(true);

    const fetchData = async () => {
      if (!documentId) return;
      try {
        const [docsRes, historyRes] = await Promise.all([
          documentApi.list(),
          chatApi.history(documentId)
        ]);
        
        const found = docsRes.data.find(d => d.id.toString() === documentId);
        if (!found) {
          toast('Document not found', 'error');
          navigate({ to: '/documents' });
          return;
        }
        setDoc(found);
        setHistory(historyRes.data);
      } catch (err) {
        toast('Failed to load chat history', 'error');
        navigate({ to: '/documents' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [documentId, navigate, toast]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, sending]);

  const handleAsk = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || !documentId) return;

    const currentQ = question.trim();
    setQuestion('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const initialMsg: AskResponse = { id: tempId, question: currentQ, answer: '', sourceCitations: '[]' };
    addMessage(initialMsg);

    try {
      await chatApi.askStream(
        documentId, 
        currentQ, 
        (text) => {
          setSending(false);
          updateMessageText(tempId, text);
        },
        (sources) => {
          updateMessageSources(tempId, JSON.stringify(sources));
        },
        () => {
          setSending(false);
        },
        (err) => {
          removeMessage(tempId);  // Remove the blank placeholder bubble
          toast('Failed to get a response. Please try again.', 'error');
          setSending(false);
        }
      );
    } catch (err) {
      removeMessage(tempId);
      toast('Failed to start stream', 'error');
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const parseCitations = (citationsStr?: string) => {
    if (!citationsStr) return [];
    try {
      const parsed = JSON.parse(citationsStr);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
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
      <div className="chat-container fade-in" style={{ padding: '24px' }}>
        <Skeleton height="20px" width="40%" style={{ marginBottom: '32px' }} />
        <Skeleton height="60px" style={{ marginBottom: '16px', marginLeft: 'auto', width: '70%' }} />
        <Skeleton height="80px" style={{ marginBottom: '24px', marginRight: 'auto', width: '70%' }} />
        <Skeleton height="60px" style={{ marginBottom: '16px', marginLeft: 'auto', width: '70%' }} />
        <Skeleton height="80px" style={{ marginBottom: '24px', marginRight: 'auto', width: '70%' }} />
      </div>
    );
  }

  return (
    <div className="chat-container fade-in">
      <div className="chat-header">
        <button className="icon-btn" aria-label="Back to documents" onClick={() => navigate({ to: '/documents' })}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="chat-title">{doc?.fileName}</div>
          <div className="chat-subtitle">DocAI Assistant</div>
        </div>
      </div>

      <div className="chat-messages">
        {history.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', margin: '0 auto 20px' }}>
              <Bot size={40} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>How can I help you today?</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '32px' }}>
              Ask any question about your document. I will search the indexed content and provide a cited answer.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {suggestedQuestions.map((sq, i) => (
                <button 
                  key={i} 
                  onClick={() => setQuestion(sq)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '20px', fontSize: '13px', padding: '8px 16px' }}
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
              <React.Fragment key={msg.id || index}>
                <div className="message user">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="bubble">{msg.question}</div>
                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                      <User size={16} />
                    </div>
                  </div>
                </div>

                <div className="message ai">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                      <Bot size={16} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <div className="bubble" style={{ marginBottom: citations.length > 0 && citations[0].text !== 'null' ? '0' : '0' }}>
                        {msg.answer}
                      </div>
                      <SourcesPanel citations={citations} />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {sending && (
          <div className="message ai">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                <Bot size={16} />
              </div>
              <div className="typing-indicator" style={{ marginTop: '4px' }}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleAsk} className="chat-form">
          <label htmlFor="chat-input" className="sr-only">Ask a question</label>
          <textarea
            id="chat-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the document..."
            rows={1}
            disabled={sending}
          />
          <button 
            type="submit" 
            className="btn-send"
            disabled={!question.trim() || sending}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
