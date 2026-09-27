export function initMobile() {
  const menuBtn = document.getElementById('mobile-active-tab-trigger');
  const sidebar = document.querySelector('.hmi-sidebar');
  const workflowCard = document.querySelector('.workflow-card');
  const breakdown = document.querySelector('.workflow-steps-breakdown');
  const pipelineStages = document.querySelectorAll('.pipeline-stage');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', (e) => {
      sidebar.classList.toggle('expanded');
      menuBtn.classList.toggle('is-open');
      document.body.classList.toggle('no-scroll', sidebar.classList.contains('expanded'));
      e.stopPropagation(); // prevent clicking document from immediately closing it
    });
  }

  // Close sidebar if clicked outside when expanded
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('expanded')) {
      const navMenu = sidebar.querySelector('.nav-menu');
      // If click is outside the navMenu and not on the hamburger button, close the menu
      if (navMenu && !navMenu.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        sidebar.classList.remove('expanded');
        if (menuBtn) menuBtn.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
      }
    }
  });

  // Mobile: One stage is always active, non-collapsible
  if (pipelineStages.length > 0 && breakdown) {
    const detailBlocks = breakdown.querySelectorAll('.stage-detail-block');

    function selectStageForMobile(stageElement) {
      if (window.innerWidth > 1024) return;
      
      const stageNum = stageElement.id.split('-').pop();
      const targetBlock = breakdown.querySelector(`.stage-detail-block[data-stage="${stageNum}"]`);
      
      // Reveal the breakdown container (if hidden)
      breakdown.classList.add('revealed');
      
      // Hide all blocks and unselect all circles
      detailBlocks.forEach(b => b.classList.remove('show-mobile'));
      pipelineStages.forEach(s => s.classList.remove('selected'));
      
      // Show the targeted one
      if (targetBlock) targetBlock.classList.add('show-mobile');
      stageElement.classList.add('selected');
    }

    // Bind click events (no toggling off)
    pipelineStages.forEach(stage => {
      stage.addEventListener('click', (e) => {
        selectStageForMobile(stage);
        e.stopPropagation();
      });
    });

    // On initial load, default to the currently 'active' stage of the job, or the first one
    if (window.innerWidth <= 1024) {
      let defaultStage = Array.from(pipelineStages).find(s => s.classList.contains('active'));
      if (!defaultStage) defaultStage = pipelineStages[0];
      if (defaultStage) selectStageForMobile(defaultStage);
    }
    
    // Also re-apply if the window is resized into mobile mode
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 1024 && !breakdown.classList.contains('revealed')) {
        let defaultStage = Array.from(pipelineStages).find(s => s.classList.contains('selected')) || 
                           Array.from(pipelineStages).find(s => s.classList.contains('active')) || 
                           pipelineStages[0];
        if (defaultStage) selectStageForMobile(defaultStage);
      } else if (window.innerWidth > 1024) {
         // Optionally clean up mobile classes if resizing to desktop, though CSS usually handles hiding them
      }
    });
  }

  // Close sidebar when a navigation item is clicked
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 1024 && sidebar) {
        sidebar.classList.remove('expanded');
        if (menuBtn) menuBtn.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
      }
    });
  });

}