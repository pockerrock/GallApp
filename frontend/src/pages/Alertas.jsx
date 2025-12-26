import React, { useState, useEffect } from 'react';
import { alertasService } from '../services/api';
import { toast } from 'react-toastify';
import { FaCheckCircle } from 'react-icons/fa';

const Alertas = () => {
  const [alertas, setAlertas] = useState([]);
  const [mostrarResueltas, setMostrarResueltas] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarAlertas();
  }, [mostrarResueltas]);

  const cargarAlertas = async () => {
    try {
      const res = await alertasService.listar({ atendida: mostrarResueltas });
      setAlertas(res.data.alertas);
    } catch (error) {
      toast.error('Error al cargar alertas');
    } finally {
      setCargando(false);
    }
  };

  const resolverAlerta = async (id) => {
    try {
      await alertasService.resolver(id);
      toast.success('Alerta resuelta');
      cargarAlertas();
    } catch (error) {
      toast.error('Error al resolver alerta');
    }
  };

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1>Alertas</h1>
          <p>Gestión de alertas del sistema</p>
        </div>
        <div>
          <label className="flex gap-2" style={{ alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={mostrarResueltas}
              onChange={(e) => setMostrarResueltas(e.target.checked)}
            />
            <span>Mostrar resueltas</span>
          </label>
        </div>
      </div>

      <div className="grid">
        {alertas.length === 0 ? (
          <div className="card">
            <p className="text-center">No hay alertas {mostrarResueltas ? 'resueltas' : 'activas'}</p>
          </div>
        ) : (
          alertas.map((alerta) => (
            <div key={alerta.id} className={`card alerta-${alerta.severidad}`} style={{ borderLeft: '4px solid' }}>
              <div className="flex-between">
                <div>
                  <h3 style={{ textTransform: 'capitalize', marginBottom: '8px' }}>{alerta.tipo.replace(/_/g, ' ')}</h3>
                  <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>{alerta.mensaje}</p>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {alerta.galpon && <span>Galpón {alerta.galpon.numero} • </span>}
                    {alerta.lote && <span>Lote {alerta.lote.codigo_lote} • </span>}
                    <span>{new Date(alerta.fecha).toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  {!alerta.atendida && (
                    <button onClick={() => resolverAlerta(alerta.id)} className="btn btn-success btn-sm">
                      <FaCheckCircle /> Resolver
                    </button>
                  )}
                  {alerta.atendida && (
                    <span className="badge badge-success">Resuelta</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alertas;
