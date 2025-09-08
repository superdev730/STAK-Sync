import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Star, Lightbulb, HelpCircle, CheckCircle, Loader2 } from "lucide-react";
import type { InsertSpeakerMessage } from "@shared/schema";

interface SpeakerMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  speakers?: Array<{
    name: string;
    title?: string;
    sessionTitle?: string;
  }>;
}

export function SpeakerMessageModal({ isOpen, onClose, eventId, speakers = [] }: SpeakerMessageModalProps) {
  const [formData, setFormData] = useState<Partial<InsertSpeakerMessage>>({
    speakerName: '',
    sessionTitle: '',
    messageType: 'question',
    messageContent: '',
    isAnonymous: false,
    isIncludedInSummary: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMessageMutation = useMutation({
    mutationFn: async (data: Partial<InsertSpeakerMessage>) => {
      return apiRequest(`/api/events/${eventId}/speaker-messages`, 'POST', data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Message Submitted! 🎯",
        description: `Your ${formData.messageType} has been sent to ${formData.speakerName}. You earned ${response.syncPointsAwarded || 5} Sync Points!`,
        variant: "default",
      });
      
      // Reset form
      setFormData({
        speakerName: '',
        sessionTitle: '',
        messageType: 'question',
        messageContent: '',
        isAnonymous: false,
        isIncludedInSummary: true
      });
      
      onClose();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user/sync-score'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Message",
        description: "Please try again. Make sure all fields are filled out correctly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.speakerName || !formData.messageContent) {
      toast({
        title: "Missing Information",
        description: "Please select a speaker and write your message.",
        variant: "destructive",
      });
      return;
    }

    submitMessageMutation.mutate(formData);
  };

  const messageTypeOptions = [
    { value: 'question', label: 'Question', icon: HelpCircle, description: 'Ask something you want answered' },
    { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, description: 'Share ideas or recommendations' },
    { value: 'expectation', label: 'Expectation', icon: Star, description: 'What you hope to learn' }
  ];

  const getMessageTypeIcon = (type: string) => {
    const option = messageTypeOptions.find(opt => opt.value === type);
    const Icon = option?.icon || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="speaker-message-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquare className="h-5 w-5 text-[#CD853F]" />
            Speak to the Speaker
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Send a message to help speakers tailor their content. Earn 5 Sync Points! 
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Speaker Selection */}
          <div className="space-y-2">
            <Label htmlFor="speaker" className="text-sm font-medium">
              Select Speaker *
            </Label>
            <Select 
              value={formData.speakerName} 
              onValueChange={(value) => {
                const speaker = speakers.find(s => s.name === value);
                setFormData(prev => ({
                  ...prev,
                  speakerName: value,
                  sessionTitle: speaker?.sessionTitle || ''
                }));
              }}
            >
              <SelectTrigger data-testid="select-speaker">
                <SelectValue placeholder="Choose a speaker..." />
              </SelectTrigger>
              <SelectContent>
                {speakers.map((speaker) => (
                  <SelectItem key={speaker.name} value={speaker.name}>
                    <div>
                      <div className="font-medium">{speaker.name}</div>
                      {speaker.sessionTitle && (
                        <div className="text-xs text-gray-500">{speaker.sessionTitle}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {speakers.length === 0 && (
                  <SelectItem value="general" data-testid="option-general-speaker">
                    General Speaker Question
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Session Title (if not auto-filled) */}
          {!formData.sessionTitle && formData.speakerName && (
            <div className="space-y-2">
              <Label htmlFor="session" className="text-sm font-medium">
                Session Title (Optional)
              </Label>
              <Input
                id="session"
                value={formData.sessionTitle || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionTitle: e.target.value }))}
                placeholder="e.g., AI in Healthcare: Future Trends"
                data-testid="input-session-title"
              />
            </div>
          )}

          {/* Message Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Message Type *</Label>
            <Select 
              value={formData.messageType} 
              onValueChange={(value: 'question' | 'suggestion' | 'expectation') => 
                setFormData(prev => ({ ...prev, messageType: value }))
              }
            >
              <SelectTrigger data-testid="select-message-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {messageTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {getMessageTypeIcon(option.value)}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Your Message *
            </Label>
            <Textarea
              id="message"
              value={formData.messageContent}
              onChange={(e) => setFormData(prev => ({ ...prev, messageContent: e.target.value }))}
              placeholder={
                formData.messageType === 'question' 
                  ? "What specific topic would you like to learn more about?"
                  : formData.messageType === 'suggestion'
                  ? "Share your ideas or recommendations for the session..."
                  : "What are you hoping to get out of this session?"
              }
              rows={4}
              className="resize-none"
              data-testid="textarea-message-content"
            />
            <div className="text-xs text-gray-500">
              {(formData.messageContent || '').length}/500 characters
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={!!formData.isAnonymous}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isAnonymous: !!checked }))
                }
                data-testid="checkbox-anonymous"
              />
              <Label htmlFor="anonymous" className="text-sm">
                Submit anonymously
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-summary"
                checked={!!formData.isIncludedInSummary}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isIncludedInSummary: !!checked }))
                }
                data-testid="checkbox-include-summary"
              />
              <Label htmlFor="include-summary" className="text-sm">
                Include in AI summary for speaker
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMessageMutation.isPending || !formData.speakerName || !formData.messageContent}
              className="flex-1 bg-[#CD853F] hover:bg-[#B8763A] text-white"
              data-testid="button-submit-message"
            >
              {submitMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Send Message (+5 Points)
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}