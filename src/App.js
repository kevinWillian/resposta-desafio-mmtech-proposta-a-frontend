import { useState, useEffect } from 'react';

import {phone} from 'phone';
import emailValidator from 'email-validator'

import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import Alert from 'react-bootstrap/Alert';

import api from './services/api'

import './App.css'


const removeEmptyStrings = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};


function ContactsList(props){
  const [showUpdate, setShowUpdate] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedContact, setSelectedContact] = useState({id:"id", name: "name", email: "email", phone: "phone"})
  const [contacts, setContacts] = useState([]);
  const [update, setUpdate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isNameBadForm, setIsNameBadForm] = useState(false);
  const [isEmailBadForm, setIsEmailBadForm] = useState(false);
  const [isPhoneBadForm, setIsPhoneBadForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
 
  useEffect(() => {
    let encoded = encodeURIComponent(props.keyword)
    api.get("/users/search?keyWord="+ encoded + "&skip="+ props.page*5 + "&limit=5").then((response) => {
      setContacts(response.data);
      setUpdate(false);
    }).catch((err) => {
      console.log("Server return error: " + err);
    });
  }, [props, update]);


  
  const handleCloseUpdate = () => setShowUpdate(false);
  const handleCloseDelete = () => setShowDelete(false);
  
  function handleShowUpdate(contact){
    setShowUpdate(true);
    setSelectedContact(contact);
  }
  function handleShowDelete(contact){
    setShowDelete(true);
    setSelectedContact(contact);
  }

  function deleteContact(){
    api.delete("/users/delete/" + selectedContact._id).then((response => {
      setUpdate(true);
      props.onUp();
    })).catch((err) => {
      console.log("Server return error: " + err);
    });
    handleCloseDelete();
  }

  let badFormation = false;

  function updateContact(){
    if(formData.phone){
      let ph = phone(formData.phone);
      if(ph.isValid === true){
        let copyFormData = JSON.parse(JSON.stringify(formData));
        copyFormData.phone = ph.phoneNumber;
        setFormData(copyFormData);
        setIsPhoneBadForm(false);
      }else{
        setIsPhoneBadForm(true);  
        badFormation = true;
      }
    }

    if(formData.name){
      let regex = /^[a-zA-Z ]+$/;
      if(!regex.test(formData.name)){
        setIsNameBadForm(true);
        badFormation = true;
      }else{
        setIsNameBadForm(false);
      }
    }

    if(formData.email){
      if(emailValidator.validate(formData.email)){
        setIsEmailBadForm(false);
      }else{
        setIsEmailBadForm(true);
        badFormation = true;
      }
    }

    if(badFormation){
      return;
    }
    

    api.put("/users/update/"+ selectedContact._id, removeEmptyStrings(formData)).then((response) => {
      setUpdate(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
      });
    }).catch((err) => {
      console.log("Server return error: " + err);
    });
    handleCloseUpdate();
  }

  
  
  let contactItens = contacts.map(contact => {
    return (<Card key={contact._id}>
      <Card.Header >
          <Card.Title className="card-header d-flex justify-content-between align-items-center">
            {contact.name}
            <Dropdown className="ml-auto">
              <Dropdown.Toggle variant="success" id="dropdown-basic">
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item href="#/action-1" onClick={() => handleShowUpdate(contact)}>Editar</Dropdown.Item>
                <Dropdown.Item href="#/action-2" onClick={() => handleShowDelete(contact)}>Deletar</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Card.Title>
        </Card.Header>
      <Card.Body>
        <Card.Text>Email: {contact.email}</Card.Text>
        <Card.Text>Telefone: {contact.phone}</Card.Text>
      </Card.Body>
    </Card>);
  })

  return (<>
    <Container key={update} fluid="md">
      {contactItens}
    </Container>
    <Modal show={showUpdate} onHide={handleCloseUpdate}>
        {isNameBadForm ? <Alert>Nome mal formado!</Alert> : <></>}
        {isEmailBadForm ? <Alert>Email mal formado!</Alert> : <></>}
        {isPhoneBadForm ? <Alert>Telefone mal formado!</Alert> : <></>}
        <Modal.Header closeButton>
          <Modal.Title>Editar Contato</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
          type="text"
          placeholder={selectedContact.name}
          className=" mr-sm-2"
          id='name'
          name='name'
          value={formData.name}
          onChange={handleChange}></Form.Control>
          <Form.Control
          type="text"
          placeholder={selectedContact.email}
          className=" mr-sm-2"
          id='email'
          name='email'
          value={formData.email}
          onChange={handleChange}></Form.Control>
          <Form.Control
          type="text"
          placeholder={selectedContact.phone}
          className=" mr-sm-2"
          id='phone'
          name='phone'
          value={formData.phone}
          onChange={handleChange}></Form.Control>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseUpdate}>
            Fechar
          </Button>
          <Button variant="primary" onClick={updateContact}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDelete} onHide={handleCloseDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Tem certeza que deseja excluir {selectedContact.name}</Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDelete}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={deleteContact}>
            Sim
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
function App() {
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [maxPage, setMaxPage] = useState(0);
  const [keyWordSearch, setKeyWordSearch] = useState("");
  const [contacsParams, setContacsParams] = useState([page, keyWordSearch]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [readyToSaveCnt, setReadyToSaveCnt] = useState(null);
  const [isNameBadForm, setIsNameBadForm] = useState(false);
  const [isEmailBadForm, setIsEmailBadForm] = useState(false);
  const [isPhoneBadForm, setIsPhoneBadForm] = useState(false);
  const [update, setUpdate] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCloseCreate = () => setShowCreate(false);
  const handleShowCreate = () => setShowCreate(true);

  function saveContact(){
    let badFormation = false;

    if(formData.phone){
      let ph = phone(formData.phone);
      if(ph.isValid === true){
        let copyFormData = JSON.parse(JSON.stringify(formData));
        copyFormData.phone = ph.phoneNumber;
        setFormData(copyFormData);
        setIsPhoneBadForm(false);
      }else{
        setIsPhoneBadForm(true);  
        badFormation = true;
      }
    }

    if(formData.name){
      let regex = /^[a-zA-Z ]+$/;
      if(!regex.test(formData.name)){
        setIsNameBadForm(true);
        badFormation = true;
      }else{
        setIsNameBadForm(false);
      }
    }

    if(formData.email){
      if(emailValidator.validate(formData.email)){
        setIsEmailBadForm(false);
      }else{
        setIsEmailBadForm(true);
        badFormation = true;
      }
    }

    if(badFormation){
      return;
    }

    setReadyToSaveCnt(formData);
    handleCloseCreate();
    setFormData({
      name: '',
      email: '',
      phone: '',
    });
  }

  useEffect(() => {
    if(readyToSaveCnt != null){
      api.post("/users/create", readyToSaveCnt).then((response => {
        if(response.status = "Ok"){
          setContacsParams(contacsParams.slice());
          setUpdate(true);
        }
      })).catch((err) => {
        console.log("Server return error: " + err);
      });
    }
  }, [readyToSaveCnt]);


  useEffect(() => {
    api.get("/users/count?keyWord=" + keyWordSearch).then((response) => {
      if(response.data.count%5 === 0){
        setMaxPage((response.data.count)/5);
      }else{
        setMaxPage(Math.floor((response.data.count)/5) + 1);
      }
      setUpdate(false);
    }).catch((err) => {
      console.log("Server return error: " + err);
    });
  }, [keyWordSearch, update]);

  function OnChangeSearch(evt){
    setKeyWordSearch(evt.target.value);
    setPage(0);
    setContacsParams([page, keyWordSearch]);
  }

  function nextPage(){
    setPage(page+1);
    setContacsParams([page, keyWordSearch]);
  }

  function leftPage(){
    setPage(page-1);
    setContacsParams([page, keyWordSearch]);
  }

  const onUpButtons = () =>{
    setUpdate(true);
  }

  return (
    <div id='App'>
      <Navbar>
      <Form inline="true">
        <Button onClick={handleShowCreate}>+</Button>
      </Form>
      <Form inline="true">
          <Form.Control
            type="text"
            placeholder="Search"
            onChange={evt => OnChangeSearch(evt)}
          />
      </Form>
    </Navbar>
    <ContactsList key={contacsParams} page={page} keyword={keyWordSearch} onUp={onUpButtons}></ContactsList>
    <Modal show={showCreate} onHide={handleCloseCreate}>
        {isNameBadForm ? <Alert>Nome mal formado!</Alert> : <></>}
        {isEmailBadForm ? <Alert>Email mal formado!</Alert> : <></>}
        {isPhoneBadForm ? <Alert>Telefone mal formado!</Alert> : <></>}
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Contato</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
          type="text"
          placeholder="Nome"
          className=" mr-sm-2"
          id='name'
          name='name'
          value={formData.name}
          onChange={handleChange}
          ></Form.Control>
          <Form.Control
          type="text"
          placeholder="Email"
          className=" mr-sm-2"
          id='email'
          name='email'
          value={formData.email}
          onChange={handleChange}></Form.Control>
          <Form.Control
          type="text"
          placeholder="Telefone"
          className=" mr-sm-2"
          id='phone'
          name='phone'
          value={formData.phone}
          onChange={handleChange}></Form.Control>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCreate}>
            Fechar
          </Button>
          <Button variant="primary" onClick={saveContact}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="footer">
        <Button disabled={page===0} onClick={leftPage}>Anterior</Button>
        <Button key={maxPage} disabled={page>=(maxPage-1)} onClick={nextPage}>Próxima</Button>
      </div>
    </div>
  );
}

export default App;
