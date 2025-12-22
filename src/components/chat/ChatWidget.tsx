'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, User, Phone, Mail } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ContactInfo {
  name: string;
  contact: string;
  contactType: 'phone' | 'email';
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    contact: '',
    contactType: 'phone' as 'phone' | 'email'
  });
  const [formError, setFormError] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with greeting when contact info is provided
  useEffect(() => {
    if (contactInfo && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Goedendag ${contactInfo.name}! Welkom bij Klinkers & Co, uw hovenier in Gouda en omstreken. Waar kan ik u mee helpen? Heeft u een vraag over tuinaanleg, bestrating, of wilt u een vrijblijvende offerte?`
        }
      ]);
    }
  }, [contactInfo, messages.length]);

  const validateContact = (value: string, type: 'phone' | 'email'): boolean => {
    if (type === 'phone') {
      // Dutch phone number validation (mobile or landline)
      const phoneRegex = /^((\+31|0031|0)[\s-]?)?(6[\s-]?[1-9](\s?\d){7}|[1-9]\d[\s-]?\d{7}|\d{10})$/;
      return phoneRegex.test(value.replace(/[\s-]/g, ''));
    } else {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!contactForm.name.trim()) {
      setFormError('Vul uw naam in');
      return;
    }

    if (!contactForm.contact.trim()) {
      setFormError(contactForm.contactType === 'phone' ? 'Vul uw telefoonnummer in' : 'Vul uw e-mailadres in');
      return;
    }

    if (!validateContact(contactForm.contact, contactForm.contactType)) {
      setFormError(contactForm.contactType === 'phone' ? 'Ongeldig telefoonnummer' : 'Ongeldig e-mailadres');
      return;
    }

    setContactInfo({
      name: contactForm.name.trim(),
      contact: contactForm.contact.trim(),
      contactType: contactForm.contactType
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !contactInfo) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          contactInfo: contactInfo // Pass contact info to API
        })
      });

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, er ging iets mis. Probeer het opnieuw of neem direct contact op via 06 53 96 78 19.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setContactInfo(null);
    setMessages([]);
    setContactForm({ name: '', contact: '', contactType: 'phone' });
    setFormError('');
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] shadow-2xl flex flex-col">
          <CardHeader className="bg-slate-800 text-white rounded-t-lg py-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-orange-400">Klinkers</span>
              <span>& Co</span>
              <span className="text-sm font-normal ml-auto bg-green-500 px-2 py-0.5 rounded-full text-xs">Online</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
            {!contactInfo ? (
              /* Contact Capture Form */
              <div className="p-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Start een gesprek</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Laat uw gegevens achter zodat wij u kunnen helpen
                  </p>
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" /> Uw naam
                    </label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Bijv. Jan de Vries"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Hoe kunnen wij u bereiken?
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setContactForm(prev => ({ ...prev, contactType: 'phone', contact: '' }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          contactForm.contactType === 'phone'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <Phone className="w-4 h-4" /> Telefoon
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactForm(prev => ({ ...prev, contactType: 'email', contact: '' }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          contactForm.contactType === 'email'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <Mail className="w-4 h-4" /> E-mail
                      </button>
                    </div>
                    <Input
                      type={contactForm.contactType === 'email' ? 'email' : 'tel'}
                      value={contactForm.contact}
                      onChange={(e) => setContactForm(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder={contactForm.contactType === 'phone' ? '06 12345678' : 'uw@email.nl'}
                      className="w-full"
                    />
                  </div>

                  {formError && (
                    <p className="text-red-500 text-sm">{formError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    Start gesprek
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    Uw gegevens gebruiken wij alleen om contact met u op te nemen over uw project.
                  </p>
                </form>
              </div>
            ) : (
              /* Chat Interface */
              <>
                {/* Contact Info Bar */}
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{contactInfo.name}</span>
                    <span className="text-gray-400">|</span>
                    {contactInfo.contactType === 'phone' ? (
                      <Phone className="w-3 h-3" />
                    ) : (
                      <Mail className="w-3 h-3" />
                    )}
                    <span className="text-xs">{contactInfo.contact}</span>
                  </div>
                  <button
                    onClick={resetChat}
                    className="text-xs text-gray-400 hover:text-gray-600"
                    title="Nieuw gesprek"
                  >
                    Nieuw
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[280px]">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Typ uw bericht..."
                      className="resize-none min-h-[40px] max-h-[80px]"
                      rows={1}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="bg-orange-500 hover:bg-orange-600 px-4"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Of bel direct: <a href="tel:0653967819" className="text-orange-500 hover:underline">06 53 96 78 19</a>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
