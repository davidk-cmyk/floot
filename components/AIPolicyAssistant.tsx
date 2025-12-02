import React, { useState } from 'react';
import { Wand2, PenSquare, Lightbulb, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { AIPolicyGenerator } from './AIPolicyGenerator';
import { AIRewriteAssistant } from './AIRewriteAssistant';
import { AIImprovementSuggestions } from './AIImprovementSuggestions';
import styles from './AIPolicyAssistant.module.css';

type AIPolicyAssistantProps = {
  // The current text content from the main policy editor
  policyText: string;
  // Callback to update the main policy editor's content
  onContentChange: (newContent: string) => void;
  className?: string;
};

export const AIPolicyAssistant = ({ policyText, onContentChange, className }: AIPolicyAssistantProps) => {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <header className={styles.header}>
        <Bot size={24} className={styles.headerIcon} />
        <h2 className={styles.title}>AI Policy Authoring Assistant</h2>
      </header>
      <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="generate">
            <Wand2 size={16} />
            Generate Policy
          </TabsTrigger>
          <TabsTrigger value="rewrite">
            <PenSquare size={16} />
            Rewrite
          </TabsTrigger>
          <TabsTrigger value="improve">
            <Lightbulb size={16} />
            Suggest Improvements
          </TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className={styles.tabContent}>
          <AIPolicyGenerator onPolicyGenerated={onContentChange} />
        </TabsContent>
        <TabsContent value="rewrite" className={styles.tabContent}>
          <AIRewriteAssistant originalText={policyText} onAccept={onContentChange} />
        </TabsContent>
        <TabsContent value="improve" className={styles.tabContent}>
          <AIImprovementSuggestions policyText={policyText} />
        </TabsContent>
      </Tabs>
    </div>
  );
};