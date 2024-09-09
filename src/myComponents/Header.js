import React from 'react'

function Header() {
  return (
    
    <nav className="navbar bg-body-tertiary ">
  <form className="container-fluid ">
    <div className="input-group ">
      <span className="input-group-text" id="basic-addon1">@</span>
      <input type="text" className="form-control " placeholder="Username" aria-label="Username" aria-describedby="basic-addon1"/>
    </div>
  </form>
</nav>
  
  )
}

export default Header