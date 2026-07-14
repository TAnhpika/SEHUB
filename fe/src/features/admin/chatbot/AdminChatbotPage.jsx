import { useEffect, useState } from "react";
import Button from "@/common/Button/Button";
import Shimmer from "@/common/Skeleton/Shimmer";
import { useToast } from "@/common/Toast/ToastProvider";
import { ACTION_LOADING } from "@/utils/actionLoadingLabels";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import {
  createAdminChatbotKnowledge,
  deleteAdminChatbotKnowledge,
  getAdminChatbotConversationMessages,
  getAdminChatbotSettings,
  listAdminChatbotConversations,
  listAdminChatbotKnowledge,
  updateAdminChatbotKnowledge,
  updateAdminChatbotSettings,
} from "@/api/chatbotApi";
import {
  mapAdminChatbotConversationDto,
  mapChatbotKnowledgeEntryDto,
  mapChatbotMessageDto,
  mapChatbotSettingsDto,
} from "@/api/chatbotMapper";
import styles from "./AdminChatbotPage.module.css";

const TABS = [
  { id: "settings", label: "Cài đặt" },
  { id: "knowledge", label: "Knowledge base" },
  { id: "conversations", label: "Hội thoại" },
];

const EMPTY_KNOWLEDGE = {
  title: "",
  content: "",
  tags: "",
  isActive: true,
  sortOrder: 0,
};

function ChatbotSettingsSkeleton() {
  return (
    <div className={styles.panel} aria-busy="true" aria-label="Đang tải cài đặt chatbot">
      <div className={styles.skeletonField}>
        <Shimmer className={styles.skeletonLabel} />
        <Shimmer className={styles.skeletonTextarea} />
      </div>
      <div className={styles.skeletonField}>
        <Shimmer className={styles.skeletonLabel} />
        <Shimmer className={`${styles.skeletonTextarea} ${styles.skeletonTextareaShort}`} />
      </div>
      <Shimmer className={styles.skeletonCheckbox} />
      <Shimmer className={styles.skeletonButton} />
    </div>
  );
}

function ChatbotKnowledgeSkeleton() {
  return (
    <div className={styles.panel} aria-busy="true" aria-label="Đang tải knowledge base">
      <div className={styles.skeletonField}>
        <Shimmer className={styles.skeletonLabel} />
        <Shimmer className={styles.skeletonInput} />
      </div>
      <div className={styles.skeletonField}>
        <Shimmer className={styles.skeletonLabel} />
        <Shimmer className={styles.skeletonTextarea} />
      </div>
      <div className={styles.skeletonField}>
        <Shimmer className={styles.skeletonLabel} />
        <Shimmer className={styles.skeletonInput} />
      </div>
      <div className={styles.skeletonField}>
        <Shimmer className={styles.skeletonLabel} />
        <Shimmer className={styles.skeletonInputShort} />
      </div>
      <Shimmer className={styles.skeletonCheckbox} />
      <Shimmer className={styles.skeletonButton} />
      <Shimmer className={styles.skeletonTable} />
    </div>
  );
}

function ChatbotTableSkeleton() {
  return (
    <div className={styles.panel} aria-busy="true" aria-label="Đang tải dữ liệu">
      <Shimmer className={styles.skeletonTable} />
    </div>
  );
}

function AdminChatbotPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [tab, setTab] = useState("settings");
  const [settingsForm, setSettingsForm] = useState({
    systemPrompt: "",
    welcomeMessage: "",
    isEnabled: true,
  });
  const [knowledge, setKnowledge] = useState([]);
  const [knowledgeForm, setKnowledgeForm] = useState(EMPTY_KNOWLEDGE);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      getAdminChatbotSettings().then(mapChatbotSettingsDto),
      listAdminChatbotKnowledge().then((list) =>
        Array.isArray(list) ? list.map(mapChatbotKnowledgeEntryDto).filter(Boolean) : [],
      ),
      listAdminChatbotConversations().then((list) =>
        Array.isArray(list) ? list.map(mapAdminChatbotConversationDto).filter(Boolean) : [],
      ),
    ])
      .then(([settings, entries, convs]) => {
        if (cancelled) return;
        if (settings) {
          setSettingsForm(settings);
        }
        setKnowledge(entries);
        setConversations(convs);
      })
      .catch((error) => {
        if (!cancelled) {
          showToast(error?.message ?? "Không tải được dữ liệu chatbot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  async function handleSaveSettings() {
    setIsSaving(true);
    try {
      const result = await updateAdminChatbotSettings(settingsForm);
      setSettingsForm(mapChatbotSettingsDto(result));
      showToast("Đã lưu cài đặt chatbot.");
    } catch (error) {
      showToast(error?.message ?? "Không lưu được cài đặt.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveKnowledge() {
    if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
      showToast("Tiêu đề và nội dung là bắt buộc.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: knowledgeForm.title.trim(),
        content: knowledgeForm.content.trim(),
        tags: knowledgeForm.tags?.trim() || null,
        isActive: knowledgeForm.isActive,
        sortOrder: Number(knowledgeForm.sortOrder) || 0,
      };

      if (editingKnowledgeId) {
        await updateAdminChatbotKnowledge(editingKnowledgeId, payload);
        showToast("Đã cập nhật mục knowledge.");
      } else {
        await createAdminChatbotKnowledge(payload);
        showToast("Đã thêm mục knowledge.");
      }

      const list = await listAdminChatbotKnowledge();
      setKnowledge(Array.isArray(list) ? list.map(mapChatbotKnowledgeEntryDto).filter(Boolean) : []);
      setKnowledgeForm(EMPTY_KNOWLEDGE);
      setEditingKnowledgeId(null);
    } catch (error) {
      showToast(error?.message ?? "Không lưu được knowledge.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteKnowledge(id) {
    const confirmed = await confirm({
      title: "Xóa knowledge",
      description: "Xóa mục knowledge này?",
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await deleteAdminChatbotKnowledge(id);
      setKnowledge((items) => items.filter((item) => item.id !== id));
      if (editingKnowledgeId === id) {
        setEditingKnowledgeId(null);
        setKnowledgeForm(EMPTY_KNOWLEDGE);
      }
      showToast("Đã xóa mục knowledge.");
    } catch (error) {
      showToast(error?.message ?? "Không xóa được mục knowledge.");
    }
  }

  async function handleSelectConversation(conversationId) {
    setSelectedConversationId(conversationId);
    setConversationMessages([]);
    setIsLoadingMessages(true);
    try {
      const list = await getAdminChatbotConversationMessages(conversationId);
      setConversationMessages(
        Array.isArray(list) ? list.map(mapChatbotMessageDto).filter(Boolean) : [],
      );
    } catch (error) {
      showToast(error?.message ?? "Không tải được tin nhắn.");
      setConversationMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId);
  const selectedUserLabel = selectedConversation?.userLabel || "Người dùng";

  return (
    <AdminPageLayout
      title="Chatbot tư vấn"
      subtitle="Cấu hình prompt, knowledge base và xem hội thoại Premium."
    >
      <div className={styles.tabs}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.tab} ${tab === item.id ? styles.tabActive : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "settings" ? (
        isLoading ? (
          <ChatbotSettingsSkeleton />
        ) : (
        <div className={styles.panel}>
          <label className={styles.field}>
            <span className={styles.label}>System prompt</span>
            <textarea
              className={styles.textarea}
              value={settingsForm.systemPrompt}
              disabled={isSaving}
              onChange={(event) =>
                setSettingsForm((prev) => ({ ...prev, systemPrompt: event.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Welcome message</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={settingsForm.welcomeMessage}
              disabled={isSaving}
              onChange={(event) =>
                setSettingsForm((prev) => ({ ...prev, welcomeMessage: event.target.value }))
              }
            />
          </label>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={settingsForm.isEnabled}
              disabled={isSaving}
              onChange={(event) =>
                setSettingsForm((prev) => ({ ...prev, isEnabled: event.target.checked }))
              }
            />
            Bật chatbot cho Premium
          </label>
          <div className={styles.actions}>
            <Button onClick={handleSaveSettings} disabled={isSaving} loading={isSaving} loadingLabel={ACTION_LOADING.save}>
              Lưu cài đặt
            </Button>
          </div>
        </div>
        )
      ) : null}

      {tab === "knowledge" ? (
        isLoading ? (
          <ChatbotKnowledgeSkeleton />
        ) : (
        <div className={styles.panel}>
          <label className={styles.field}>
            <span className={styles.label}>Tiêu đề</span>
            <input
              className={styles.input}
              value={knowledgeForm.title}
              disabled={isSaving}
              onChange={(event) =>
                setKnowledgeForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Nội dung</span>
            <textarea
              className={styles.textarea}
              value={knowledgeForm.content}
              disabled={isSaving}
              onChange={(event) =>
                setKnowledgeForm((prev) => ({ ...prev, content: event.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Tags (phân cách bằng dấu phẩy)</span>
            <input
              className={styles.input}
              value={knowledgeForm.tags}
              disabled={isSaving}
              onChange={(event) =>
                setKnowledgeForm((prev) => ({ ...prev, tags: event.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Thứ tự</span>
            <input
              className={styles.input}
              type="number"
              value={knowledgeForm.sortOrder}
              disabled={isSaving}
              onChange={(event) =>
                setKnowledgeForm((prev) => ({ ...prev, sortOrder: event.target.value }))
              }
            />
          </label>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={knowledgeForm.isActive}
              disabled={isSaving}
              onChange={(event) =>
                setKnowledgeForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Đang kích hoạt
          </label>
          <div className={styles.actions}>
            <Button onClick={handleSaveKnowledge} disabled={isSaving} loading={isSaving} loadingLabel={ACTION_LOADING.save}>
              {editingKnowledgeId ? "Cập nhật" : "Thêm mục"}
            </Button>
            {editingKnowledgeId ? (
              <Button
                look="outline"
                disabled={isSaving}
                onClick={() => {
                  setEditingKnowledgeId(null);
                  setKnowledgeForm(EMPTY_KNOWLEDGE);
                }}
              >
                Hủy sửa
              </Button>
            ) : null}
          </div>

          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Tags</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {knowledge.length > 0 ? (
                knowledge.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.title}</td>
                    <td>{entry.tags || "—"}</td>
                    <td>
                      <span
                        className={
                          entry.isActive ? styles.statusActive : styles.statusInactive
                        }
                      >
                        {entry.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Button
                          size="sm"
                          look="outline"
                          disabled={isSaving}
                          onClick={() => {
                            setEditingKnowledgeId(entry.id);
                            setKnowledgeForm({
                              title: entry.title,
                              content: entry.content,
                              tags: entry.tags ?? "",
                              isActive: entry.isActive,
                              sortOrder: entry.sortOrder,
                            });
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          look="outline"
                          disabled={isSaving}
                          onClick={() => handleDeleteKnowledge(entry.id)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.tableEmpty}>
                    Chưa có mục knowledge nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
        )
      ) : null}

      {tab === "conversations" ? (
        isLoading ? (
          <ChatbotTableSkeleton />
        ) : (
        <div className={styles.panel}>
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Người dùng</th>
                <th>Tin nhắn</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td>{conversation.title}</td>
                  <td title={conversation.username || undefined}>{conversation.userLabel}</td>
                  <td>{conversation.messageCount}</td>
                  <td>
                    <Button
                      size="sm"
                      look="outline"
                      disabled={isLoadingMessages && selectedConversationId === conversation.id}
                      loading={isLoadingMessages && selectedConversationId === conversation.id}
                      loadingLabel="Đang tải..."
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      Xem
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {selectedConversationId ? (
            <div className={styles.messageList} aria-busy={isLoadingMessages}>
              {isLoadingMessages ? (
                <>
                  <Shimmer className={styles.skeletonMessage} />
                  <Shimmer className={styles.skeletonMessage} />
                  <Shimmer className={styles.skeletonMessage} />
                </>
              ) : conversationMessages.length > 0 ? (
                conversationMessages.map((message) => (
                  <div key={message.id} className={styles.messageItem}>
                    <p className={styles.messageRole}>
                      {message.role === "assistant" ? "SEHub AI" : selectedUserLabel}
                    </p>
                    <p className={styles.messageText}>{message.text}</p>
                  </div>
                ))
              ) : (
                <p className={styles.loadingMessages}>Không có tin nhắn trong hội thoại này.</p>
              )}
            </div>
          ) : null}
        </div>
        )
      ) : null}
    </AdminPageLayout>
  );
}

export default AdminChatbotPage;
