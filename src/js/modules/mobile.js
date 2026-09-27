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

  // Toggle subprocesses on current job mobile view
  if (pipelineStages.length > 0 && breakdown) {
    const detailBlocks = breakdown.querySelectorAll('.stage-detail-block');

    pipelineStages.forEach(stage => {
      stage.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          // Find the index or ID
          const stageNum = stage.id.split('-').pop(); // '1' from 'stage-col-1'
          const targetBlock = breakdown.querySelector(`.stage-detail-block[data-stage="${stageNum}"]`);
          
          if (targetBlock) {
            breakdown.classList.add('revealed');
            detailBlocks.forEach(b => b.classList.remove('show-mobile'));
            pipelineStages.forEach(s => s.classList.remove('selected'));
            targetBlock.classList.add('show-mobile');
            stage.classList.add('selected');
          }
          
          e.stopPropagation();
        }
      });
    });


  }


  // Lock one stage active by default on mobile load
  if (window.innerWidth <= 1024 && pipelineStages.length > 0 && breakdown) {
    const defaultStage = Array.from(pipelineStages).find(s => s.classList.contains('active')) || pipelineStages[0];
    const stageNum = defaultStage.id.split('-').pop();
    const targetBlock = breakdown.querySelector(`.stage-detail-block[data-stage="${stageNum}"]`);
    
    if (targetBlock) {
      breakdown.classList.add('revealed');
      breakdown.querySelectorAll('.stage-detail-block').forEach(b => b.classList.remove('show-mobile'));
      pipelineStages.forEach(s => s.classList.remove('selected'));
      targetBlock.classList.add('show-mobile');
      defaultStage.classList.add('selected');
    }
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