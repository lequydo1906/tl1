// Cây Gia Phả - Family Tree Application
// Lưu trữ dữ liệu trên file JSON thông qua server

const API_URL = 'http://localhost:3000/api';

class FamilyTree {
  constructor() {
    this.members = [];
    this.loadFromServer();
  }

  async loadFromServer() {
    try {
      const response = await fetch(`${API_URL}/members`);
      if (response.ok) {
        this.members = await response.json();
      }
      this.init();
      this.render();
    } catch (error) {
      console.log('Server không khả dụng, dùng chế độ offline');
      this.init();
      this.render();
    }
  }

  async saveToServer() {
    try {
      await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.members)
      });
    } catch (error) {
      console.log('Lưu lên server thất bại');
    }
  }

  addMember(name, birthYear, gender, parentId) {
    const member = {
      id: Date.now().toString(),
      name,
      birthYear: birthYear ? parseInt(birthYear) : null,
      gender,
      parentId: parentId || null,
      children: []
    };
    this.members.push(member);
    if (parentId) {
      const parent = this.members.find(m => m.id === parentId);
      if (parent && !parent.children.includes(member.id)) {
        parent.children.push(member.id);
      }
    }
    this.saveToServer();
    return member;
  }

  deleteMember(id) {
    // Remove from parent's children
    const member = this.members.find(m => m.id === id);
    if (member && member.parentId) {
      const parent = this.members.find(m => m.id === member.parentId);
      if (parent) {
        parent.children = parent.children.filter(cId => cId !== id);
      }
    }
    // Remove member and its children
    this.members = this.members.filter(m => m.id !== id && m.parentId !== id);
    this.saveToServer();
  }

  getMemberById(id) {
    return this.members.find(m => m.id === id);
  }

  getParents(memberId) {
    const member = this.members.find(m => m.id === memberId);
    return member && member.parentId ? [this.getMemberById(member.parentId)] : [];
  }

  getChildren(memberId) {
    const member = this.members.find(m => m.id === memberId);
    return member ? member.children.map(cId => this.getMemberById(cId)).filter(m => m) : [];
  }

  getSiblings(memberId) {
    const member = this.members.find(m => m.id === memberId);
    if (!member || !member.parentId) return [];
    const parent = this.getMemberById(member.parentId);
    return parent.children
      .map(cId => this.getMemberById(cId))
      .filter(m => m && m.id !== memberId);
  }

  getRootMembers() {
    return this.members.filter(m => !m.parentId);
  }

  init() {
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    document.getElementById('addMemberForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('memberName').value.trim();
      const birthYear = document.getElementById('birthYear').value;
      const gender = document.getElementById('gender').value;
      const parentId = document.getElementById('parentSelect').value;

      if (name) {
        this.addMember(name, birthYear, gender, parentId || null);
        document.getElementById('addMemberForm').reset();
        this.render();
      }
    });

    // Modal close
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  updateParentSelectOptions() {
    const parentSelect = document.getElementById('parentSelect');
    const currentOptions = parentSelect.innerHTML;
    const newOptions = '<option value="">-- Không có --</option>' +
      this.members
        .map(m => `<option value="${m.id}">${m.name}</option>`)
        .join('');
    if (currentOptions !== newOptions) {
      parentSelect.innerHTML = newOptions;
    }
  }

  renderMembersList() {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = this.members
      .map(m => `
        <div class="member-item" onclick="familyTree.showMemberDetails('${m.id}')">
          <div class="member-item-name">${m.name}</div>
          <div class="member-item-info">
            ${m.gender} ${m.birthYear ? '• ' + m.birthYear : ''}
          </div>
          <button class="member-item-delete" onclick="event.stopPropagation(); familyTree.deleteMember('${m.id}'); familyTree.render();">Xóa</button>
        </div>
      `)
      .join('');
  }

  renderTree() {
    const treeContainer = document.getElementById('treeContainer');
    const emptyState = document.getElementById('emptyState');

    if (this.members.length === 0) {
      treeContainer.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    const rootMembers = this.getRootMembers();
    let html = '';

    // Nhóm các thế hệ
    html += this.renderGenerationGroup(rootMembers, 'Tổ Tiên / Ông Bà');

    // Nhóm bố mẹ
    const parentsGeneration = new Set();
    this.members.forEach(m => {
      if (m.parentId) {
        const parent = this.getMemberById(m.parentId);
        if (parent && !parent.parentId) {
          parentsGeneration.add(parent);
        }
      }
    });

    if (parentsGeneration.size > 0) {
      html += this.renderGenerationGroup(Array.from(parentsGeneration), 'Bố Mẹ');
    }

    // Nhóm con em / cháu
    const childrenGeneration = new Set();
    this.members.forEach(m => {
      this.getChildren(m.id).forEach(child => childrenGeneration.add(child));
    });

    if (childrenGeneration.size > 0) {
      html += this.renderGenerationGroup(Array.from(childrenGeneration), 'Con / Cháu');
    }

    treeContainer.innerHTML = html;
  }

  renderGenerationGroup(members, title) {
    if (members.length === 0) return '';

    const membersHtml = members
      .map(m => `
        <div class="member-card" onclick="familyTree.showMemberDetails('${m.id}')">
          <div class="member-card-name">${m.name}</div>
          ${m.birthYear ? `<div class="member-card-info">Sinh: ${m.birthYear}</div>` : ''}
          <span class="member-card-gender ${m.gender === 'Nam' ? 'male' : 'female'}">${m.gender}</span>
        </div>
      `)
      .join('');

    return `
      <div class="family-group">
        <div class="family-group-title">${title}</div>
        <div class="members-grid">${membersHtml}</div>
      </div>
    `;
  }

  showMemberDetails(memberId) {
    const member = this.getMemberById(memberId);
    if (!member) return;

    const parents = this.getParents(memberId);
    const children = this.getChildren(memberId);
    const siblings = this.getSiblings(memberId);

    let parentsSectionHtml = '<strong>Cha/Mẹ:</strong> ';
    if (parents.length > 0) {
      parentsSectionHtml += parents.map(p => p.name).join(', ');
    } else {
      parentsSectionHtml += 'Chưa có';
    }

    let childrenSectionHtml = '<strong>Con:</strong> ';
    if (children.length > 0) {
      childrenSectionHtml += children.map(c => c.name).join(', ');
    } else {
      childrenSectionHtml += 'Chưa có';
    }

    let siblingsSectionHtml = '<strong>Anh/Chị/Em:</strong> ';
    if (siblings.length > 0) {
      siblingsSectionHtml += siblings.map(s => s.name).join(', ');
    } else {
      siblingsSectionHtml += 'Chưa có';
    }

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h2>${member.name}</h2>
      <div class="modal-field">
        <div class="modal-field-label">Giới tính</div>
        <div class="modal-field-value">${member.gender}</div>
      </div>
      ${member.birthYear ? `
        <div class="modal-field">
          <div class="modal-field-label">Năm sinh</div>
          <div class="modal-field-value">${member.birthYear}</div>
        </div>
      ` : ''}
      <div class="modal-field">
        <div class="modal-field-label">Quan hệ</div>
        <div class="modal-field-value">
          <p>${parentsSectionHtml}</p>
          <p>${childrenSectionHtml}</p>
          <p>${siblingsSectionHtml}</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-delete" onclick="familyTree.deleteMember('${memberId}'); familyTree.render(); document.getElementById('modal').style.display = 'none';">Xóa Thành Viên</button>
      </div>
    `;

    document.getElementById('modal').style.display = 'block';
  }

  render() {
    this.updateParentSelectOptions();
    this.renderMembersList();
    this.renderTree();
  }
}

// Khởi tạo ứng dụng
const familyTree = new FamilyTree();

