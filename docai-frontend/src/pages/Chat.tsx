import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { chatApi, documentApi, AskResponse } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Send, ArrowLeft, Bot, User, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Document } from '@/types';
import { useChatStore } from '../hooks/useChatStore';

interface CitationItem {
  chunk_index?: number | string;
  text?: string;
  text_snippet?: string;
  document_id?: number | string;
  document_name?: string;
}

const SourcesPanel = ({ 
  citations, 
  availableDocs 
}: { 
  citations: CitationItem[]; 
  availableDocs: Document[] 
}) => {
  const [expanded, setExpanded] = useState(false);

  // Group citations by document
  const groupedCitations = useMemo(() => {
    if (!citations || citations.length === 0 || (citations.length === 1 && citations[0].text === 'null')) {
      return {};
    }
    const docNameMap: Record<string, string> = {};
    availableDocs.forEach(d => {
      docNameMap[String(d.id)] = d.fileName;
    });

    const groups: Record<string, { label: string; chunks: CitationItem[] }> = {};
    citations.forEach(cite => {
      const docId = cite.document_id ? String(cite.document_id) : 'primary';
      const label = docId === 'primary' 
        ? 'Primary Document' 
        : (docNameMap[docId] || `Document #${docId}`);
      if (!groups[docId]) {
        groups[docId] = { label, chunks: [] };
      }
      groups[docId].chunks.push(cite);
    });
    return groups;
  }, [citations, availableDocs]);

  if (!citations || citations.length === 0 || (citations.length === 1 && citations[0].text === 'null')) {
    return null;
  }

  return (
    <div className="sources-panel">
      <div className="sources-header" onClick={() => setExpanded(!expanded)}>
        <span>Sources ({citations.length} across {Object.keys(groupedCitations).length} doc{Object.keys(groupedCitations).length > 1 ? 's' : ''})</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {expanded && (
        <div className="sources-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(groupedCitations).map(([docId, group]) => (
            <div key={docId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '4px'
              }}>
                <FileText size={13} />
                <span>{group.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({group.chunks.length} chunk{group.chunks.length > 1 ? 's' : ''})
                </span>
              </div>

              {group.chunks.map((cite, i) => {
                const rawText = cite.text || cite.text_snippet || '';
                const isTruncated = rawText.length > 150;
                return (
                  <div key={i} className="source-card">
                    <span className="source-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Chunk {cite.chunk_index ?? (i + 1)}</span>
                    </span>
                    <div className="source-text">
                      {isTruncated ? (
                        <>
                          {rawText.substring(0, 150)}...
                          <span 
                            style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: '4px', fontWeight: '500' }}
                            onClick={(e: any) => {
                              e.target.parentElement.innerHTML = rawText;
                            }}
                          >
                            Show more
                          </span>
                        </>
                      ) : (
                        rawText
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const { documentId } = useParams({ strict: false }) as any;
  const [question, setQuestion] = useState('');
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [compareDocIds, setCompareDocIds] = useState<string[]>([]);
  const [showDocPicker, setShowDocPicker] = useState(false);
  
  const { 
    doc, history, loading, sending, 
    setDoc, setHistory, setLoading, setSending, 
    addMessage, removeMessage, updateMessageText, updateMessageSources, updateMessageError 
  } = useChatStore();
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isCancelled = false;
    // Reset store state whenever the primary documentId changes
    setDoc(null);
    setHistory([]);
    setCompareDocIds([]);
    setLoading(true);

    const fetchData = async () => {
      if (!documentId) return;
      try {
        const [docsRes, historyRes] = await Promise.all([
          documentApi.list(),
          chatApi.history(documentId)
        ]);
        
        if (isCancelled) return;

        const docList: Document[] = Array.isArray(docsRes.data?.content) 
          ? docsRes.data.content 
          : (Array.isArray(docsRes.data) ? docsRes.data : []);
        setAllDocs(docList);
        const found = docList.find((d: Document) => d.id.toString() === documentId);
        if (!found) {
          toast('Document not found', 'error');
          navigate({ to: '/documents' });
          return;
        }
        setDoc(found);
        setHistory(historyRes.data);
      } catch (err) {
        if (!isCancelled) {
          toast('Failed to load chat history', 'error');
          navigate({ to: '/documents' });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [documentId, navigate, toast]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, sending]);

  const toggleCompareDoc = (id: string) => {
    if (id === documentId) return;
    setCompareDocIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const activeDocIds = useMemo(() => {
    return Array.from(new Set([documentId, ...compareDocIds]));
  }, [documentId, compareDocIds]);

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
          const msg = typeof err === 'string' ? err : 'Failed to get a response. Please try again.';
          updateMessageError(tempId, msg);
          setSending(false);
        },
        activeDocIds.length > 1 ? activeDocIds : undefined
      );
    } catch (err) {
      updateMessageError(tempId, 'Could not reach the server. Please check your connection and try again.');
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const parseCitations = (citationsStr?: string): CitationItem[] => {
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
      <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="icon-btn" aria-label="Back to documents" onClick={() => navigate({ to: '/documents' })}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="chat-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{doc?.fileName}</span>
              {compareDocIds.length > 0 && (
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  Comparing {activeDocIds.length} Docs
                </span>
              )}
            </div>
            <div className="chat-subtitle">
              {compareDocIds.length > 0 
                ? `Cross-referencing: ${doc?.fileName}, ${allDocs.filter(d => compareDocIds.includes(String(d.id))).map(d => d.fileName).join(', ')}`
                : 'DocAI Assistant'}
            </div>
          </div>
        </div>

        {/* Multi-Document Comparison Selector */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowDocPicker(!showDocPicker)}
            style={{
              fontSize: '13px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: compareDocIds.length > 0 ? 'var(--primary-light, #eef2ff)' : '#ffffff',
              color: compareDocIds.length > 0 ? 'var(--primary, #4f46e5)' : 'var(--text-secondary, #334155)',
              borderColor: compareDocIds.length > 0 ? 'var(--primary, #4f46e5)' : 'var(--border-color, #e2e8f0)',
              fontWeight: compareDocIds.length > 0 ? 600 : 500,
              boxShadow: compareDocIds.length > 0 ? '0 1px 2px rgba(79, 70, 229, 0.15)' : 'none'
            }}
          >
            <FileText size={14} style={{ color: compareDocIds.length > 0 ? 'var(--primary, #4f46e5)' : 'inherit' }} />
            <span>{compareDocIds.length > 0 ? `Compare (${compareDocIds.length} added)` : '+ Compare Docs'}</span>
            <ChevronDown size={14} />
          </button>

          {showDocPicker && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '8px',
              width: '290px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '10px',
              boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
              padding: '14px',
              zIndex: 100
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary, #334155)' }}>
                Select documents to cross-compare:
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {allDocs.filter(d => String(d.id) !== documentId && d.status === 'INDEXED').length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', padding: '8px 4px' }}>
                    No other indexed documents found. Upload and index more files on the Documents page to compare.
                  </div>
                ) : (
                  allDocs
                    .filter(d => String(d.id) !== documentId && d.status === 'INDEXED')
                    .map(d => {
                      const isSelected = compareDocIds.includes(String(d.id));
                      return (
                        <label
                          key={d.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--primary-light, #eef2ff)' : 'transparent',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCompareDoc(String(d.id))}
                            style={{ cursor: 'pointer', accentColor: 'var(--primary, #4f46e5)' }}
                          />
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isSelected ? 'var(--primary, #4f46e5)' : 'var(--text-main, #0f172a)',
                            fontWeight: isSelected ? 600 : 400
                          }}>
                            {d.fileName}
                          </span>
                        </label>
                      );
                    })
                )}
              </div>
              {compareDocIds.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                  <button
                    type="button"
                    onClick={() => setCompareDocIds([])}
                    style={{
                      fontSize: '12px',
                      color: 'var(--primary, #4f46e5)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>
          )}
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
                    <div style={{
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: msg.isError ? 'rgba(239,68,68,0.12)' : 'var(--primary-light)',
                      color: msg.isError ? '#dc2626' : 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px'
                    }}>
                      <Bot size={16} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <div
                        className="bubble"
                        style={msg.isError ? {
                          backgroundColor: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          color: '#dc2626',
                          fontStyle: 'italic'
                        } : {}}
                        role={msg.isError ? 'alert' : undefined}
                      >
                        {msg.answer}
                      </div>
                      {!msg.isError && <SourcesPanel citations={citations} availableDocs={allDocs} />}
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
