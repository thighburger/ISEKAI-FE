/**
 * 채팅 메시지 목록 및 말풍선 생성을 관리하는 클래스
 */
export class ChatManager {
  private _messageList: HTMLElement | null;
  private _isManuallyHidden = false;

  constructor() {
    // index.html의 메시지 리스트 요소를 참조합니다.
    this._messageList = document.getElementById('message-list');

    if (!this._messageList) {
      console.error('Chat message list element not found!');
    }
  }

  /**
   * 새로운 메시지 말풍선을 생성하여 화면에 추가합니다.
   */
  private createMessageBubble(sender: 'ai' | 'user', message: string): void {
    if (!this._messageList) return;

    const bubble = document.createElement('div');
    // chatpage.css의 스타일을 적용합니다.
    bubble.className = `bubble ${sender}`;
    bubble.innerText = message;

    this._messageList.appendChild(bubble);

    // 새 메시지 추가 시 자동 스크롤
    this._messageList.scrollTop = this._messageList.scrollHeight;
  }

  /**
   * 캐릭터(AI)의 메시지를 추가합니다.
   */
  public showMessage(name: string, message: string): void {
    this.createMessageBubble('ai', message);
  }

  /**
   * 사용자의 메시지를 추가합니다.
   */
  public addUserMessage(message: string): void {
    this.createMessageBubble('user', message);
  }

  public show(): void {
    document.getElementById('page-chat')?.classList.remove('hidden');
  }

  public hide(): void {
    document.getElementById('page-chat')?.classList.add('hidden');
  }

  public toggle(): void {
    this._isManuallyHidden = !this._isManuallyHidden;
    this._isManuallyHidden ? this.hide() : this.show();
  }
}