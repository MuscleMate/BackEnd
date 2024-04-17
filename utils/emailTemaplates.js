const resetPasswordTemplate = (firstName, link) =>
  `
  <p style="color: black;">
      Witaj, ${firstName}!<br><br>
      
      Otrzymujesz tego maila, ponieważ rozpocząłeś/aś proces resetowania swojego hasła. Aby kontynuować ten proces, kliknij poniższy link:<br><br>
    
      <a href="${link}"><b>Kliknij tutaj, aby zresetować hasło</b></a><br><br>
    
      Powyższy link będzie aktywny przez następną godzinę. Po tym czasie zostanie on dezaktywowany.<br><br>
    
      Jeśli nie prosiłeś/aś o zresetowanie hasła, zignoruj tę wiadomość. Twoje konto pozostanie bez zmian.<br><br>
    
      Z poważaniem,<br>
      Zespół MuscleMate
      </p>
`;

module.exports = { resetPasswordTemplate };
