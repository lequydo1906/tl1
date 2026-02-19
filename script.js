// Cây Gia Phả - Family Tree Application
// Lưu trữ dữ liệu trên file JSON thông qua server

const API_URL = 'http://localhost:3000/api';

class FamilyTree {
  constructor() {
    this.members = [];
    this.selfId = null;
    this.loadFromServer();
  }

  async loadFromServer() {
    try {
      const response = await fetch(`${API_URL}/members`);
      if (response.ok) {
        this.members = await response.json();
        console.log('Loaded members:', this.members);
        // Tìm selfId từ member có isSelf = true
        const selfMember = this.members.find(m => m.isSelf === true);
        console.log('Self member found:', selfMember);
        if (selfMember) {
          this.selfId = selfMember.id;
          localStorage.setItem('selfId', selfMember.id);
          console.log('Self ID set to:', this.selfId);
        } else {
          this.selfId = localStorage.getItem('selfId');
          console.log('Self ID from localStorage:', this.selfId);
        }
      }
      this.init();
      this.render();
    } catch (error) {
      console.log('Server không khả dụng, dùng chế độ offline', error);
      this.selfId = localStorage.getItem('selfId');
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

  addMember(name, birthYear, gender, parentId, isSelf = false) {
    const member = {
      id: Date.now().toString(),
      name,
      birthYear: birthYear ? parseInt(birthYear) : null,
      gender,
      parentId: parentId || null,
      children: [],
      isSelf: isSelf
    };
    this.members.push(member);
    if (parentId) {
      const parent = this.members.find(m => m.id === parentId);
      if (parent && !parent.children.includes(member.id)) {
        parent.children.push(member.id);
      }
    }
    if (isSelf) {
      this.selfId = member.id;
      localStorage.setItem('selfId', member.id);
    }
    this.saveToServer();
    return member;
  }

  deleteMember(id) {
    const member = this.members.find(m => m.id === id);
    if (member && member.parentId) {
      const parent = this.members.find(m => m.id === member.parentId);
      if (parent) {
        parent.children = parent.children.filter(cId => cId !== id);
      }
    }
    this.members = this.members.filter(m => m.id !== id && m.parentId !== id);
    if (id === this.selfId) {
      this.selfId = null;
      localStorage.removeItem('selfId');
    }
    this.saveToServer();
  }

  getMemberById(id) {
    return this.members.find(m => m.id === id);
  }

  getSelf() {
    // Luôn tìm từ members có isSelf = true trước
    let self = this.members.find(m => m.isSelf === true);
    if (self) {
      this.selfId = self.id;
      return self;
    }
    // Nếu không có, dùng selfId từ memory
    if (this.selfId) {
      return this.getMemberById(this.selfId);
    }
    return null;
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
    this.initDragFloatingBox();
  }

  setupEventListeners() {
    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) {
      addMemberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('memberName').value.trim();
        const birthYear = document.getElementById('birthYear').value;
        const gender = document.getElementById('gender').value;
        const parentId = document.getElementById('parentSelect').value;

        if (name) {
          this.addMember(name, birthYear, gender, parentId || null);
          addMemberForm.reset();
          this.render();
        }
      });
    }

    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  showSelfForm() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
      <h2>Thông tin bản thân</h2>
      <form id="selfForm">
        <div class="form-group">
          <label for="selfName">Tên của bạn</label>
          <input type="text" id="selfName" placeholder="Họ tên" required>
        </div>
        <div class="form-group">
          <label for="selfBirthYear">Năm sinh</label>
          <input type="number" id="selfBirthYear" placeholder="1980" min="1900">
        </div>
        <div class="form-group">
          <label for="selfGender">Giới tính</label>
          <select id="selfGender">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
        <button type="submit" class="btn-primary">Xác nhận</button>
      </form>
    `;
    
    document.getElementById('selfForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('selfName').value.trim();
      const birthYear = document.getElementById('selfBirthYear').value;
      const gender = document.getElementById('selfGender').value;
      
      if (name) {
        this.addMember(name, birthYear, gender, null, true);
        modal.style.display = 'none';
        this.render();
      }
    });
    
    modal.style.display = 'block';
  }

  renderSelfSection() {
    const floatingBox = document.getElementById('floatingBox');
    const selfInfoSection = document.getElementById('selfInfoSection');
    const addMemberSection = document.getElementById('addMemberSection');
    const debugInfo = document.getElementById('debugInfo');
    const self = this.getSelf();
    
    // Update debug info
    if (debugInfo) {
      debugInfo.innerHTML = `
        Members: ${this.members.length}<br>
        SelfId: ${this.selfId}<br>
        Self: ${self ? self.name : 'null'}
      `;
    }
    
    console.log('renderSelfSection called. Self:', self, 'SelfId:', this.selfId);
    
    if (!self) {
      floatingBox.classList.remove('hidden');
      selfInfoSection.innerHTML = '';
      addMemberSection.style.display = 'none';
    } else {
      floatingBox.classList.add('hidden');
      selfInfoSection.innerHTML = `
        <div class="self-info-name">${self.name}</div>
        <div class="self-info-detail">Giới tính: ${self.gender}</div>
        ${self.birthYear ? `<div class="self-info-detail">Sinh: ${self.birthYear}</div>` : ''}
        <button class="self-info-edit" onclick="familyTree.editSelf()" style="display: block; margin-top: 10px;">Sửa</button>
      `;
      addMemberSection.style.display = 'block';
    }
  }

  editSelf() {
    const self = this.getSelf();
    if (!self) return;
    
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
      <h2>Chỉnh sửa thông tin</h2>
      <form id="editSelfForm">
        <div class="form-group">
          <label for="editSelfName">Tên của bạn</label>
          <input type="text" id="editSelfName" value="${self.name}" required>
        </div>
        <div class="form-group">
          <label for="editSelfBirthYear">Năm sinh</label>
          <input type="number" id="editSelfBirthYear" value="${self.birthYear || ''}" min="1900">
        </div>
        <div class="form-group">
          <label for="editSelfGender">Giới tính</label>
          <select id="editSelfGender">
            <option value="Nam" ${self.gender === 'Nam' ? 'selected' : ''}>Nam</option>
            <option value="Nữ" ${self.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
          </select>
        </div>
        <button type="submit" class="btn-primary">Lưu</button>
      </form>
    `;
    
    document.getElementById('editSelfForm').addEventListener('submit', (e) => {
      e.preventDefault();
      self.name = document.getElementById('editSelfName').value.trim();
      self.birthYear = document.getElementById('editSelfBirthYear').value ? parseInt(document.getElementById('editSelfBirthYear').value) : null;
      self.gender = document.getElementById('editSelfGender').value;
      
      this.saveToServer();
      modal.style.display = 'none';
      this.render();
    });
    
    modal.style.display = 'block';
  }

  initDragFloatingBox() {
    const floatingBox = document.getElementById('floatingBox');
    let isDragging = false;
    let initialX;
    let initialY;

    floatingBox.addEventListener('dragstart', (e) => {
      isDragging = true;
      initialX = e.clientX - floatingBox.getBoundingClientRect().left;
      initialY = e.clientY - floatingBox.getBoundingClientRect().top;
      floatingBox.style.opacity = '0.7';
    });

    document.addEventListener('dragover', (e) => {
      if (isDragging) {
        e.preventDefault();
      }
    });

    document.addEventListener('drop', (e) => {
      if (isDragging) {
        e.preventDefault();
        const newX = e.clientX - initialX;
        const newY = e.clientY - initialY;
        
        floatingBox.style.left = newX + 'px';
        floatingBox.style.right = 'auto';
        floatingBox.style.top = newY + 'px';
        floatingBox.style.bottom = 'auto';
        floatingBox.style.opacity = '1';
        
        isDragging = false;
      }
    });

    floatingBox.addEventListener('dragend', () => {
      floatingBox.style.opacity = '1';
      isDragging = false;
    });

    floatingBox.addEventListener('click', (e) => {
      if (!isDragging) {
        this.showSelfForm();
      }
    });
  }

  updateParentSelectOptions() {
    const parentSelect = document.getElementById('parentSelect');
    if (!parentSelect) return;
    
    const currentOptions = parentSelect.innerHTML;
    const newOptions = '<option value="">-- Không có --</option>' +
      this.members
        .filter(m => m.id !== this.selfId)
        .map(m => `<option value="${m.id}">${m.name}</option>`)
        .join('');
    if (currentOptions !== newOptions) {
      parentSelect.innerHTML = newOptions;
    }
  }

  renderMembersList() {
    const membersList = document.getElementById('membersList');
    const otherMembers = this.members.filter(m => m.id !== this.selfId);
    
    if (otherMembers.length === 0) {
      membersList.innerHTML = '';
      return;
    }
    
    membersList.innerHTML = otherMembers
      .map(m => `
        <div class="member-item" onclick="familyTree.showMemberDetails('${m.id}')">
          <div class="member-item-name">${m.name}</div>
          <div class="member-item-info">
            ${m.gender} ${m.birthYear ? '• ' + m.birthYear : ''}
          </div>
          <button class="member-item-delete" onclick="event.stopPropagation(); familyTree.deleteMember('${m.id}'); familyTree.render();">X</button>
        </div>
      `)
      .join('');
  }

  renderTree() {
    const treeContainer = document.getElementById('treeContainer');
    const emptyState = document.getElementById('emptyState');

    const otherMembers = this.members.filter(m => m.id !== this.selfId);

    if (otherMembers.length === 0) {
      treeContainer.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    const rootMembers = otherMembers.filter(m => !m.parentId);
    let html = '';

    html += this.renderGenerationGroup(rootMembers, 'Tổ Tiên / Ông Bà');

    const parentsGeneration = new Set();
    otherMembers.forEach(m => {
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

    const childrenGeneration = new Set();
    otherMembers.forEach(m => {
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
    this.renderSelfSection();
    this.updateParentSelectOptions();
    this.renderMembersList();
    this.renderTree();
  }
}

// Khởi tạo ứng dụng
const familyTree = new FamilyTree();

