import React, { useState } from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con ellipsis
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

      // Primera página siempre visible
      pages.push(1);

      if (shouldShowLeftDots) {
        pages.push('...');
      } else if (leftSiblingIndex === 2) {
        pages.push(2);
      }

      // Páginas del medio
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (shouldShowRightDots) {
        pages.push('...');
      } else if (rightSiblingIndex === totalPages - 1) {
        pages.push(totalPages - 1);
      }

      // Última página siempre visible
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pages = getPageNumbers();

  return (
    <div className="d-flex justify-content-center align-items-center gap-2 my-4">
      {/* Botón Anterior */}
      <BootstrapPagination size="sm" className="mb-0">
        <BootstrapPagination.Prev
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </BootstrapPagination.Prev>
      </BootstrapPagination>

      {/* Números de página */}
      <BootstrapPagination size="sm" className="mb-0">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <BootstrapPagination.Ellipsis key={`ellipsis-${index}`} disabled />
            );
          }

          return (
            <BootstrapPagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </BootstrapPagination.Item>
          );
        })}
      </BootstrapPagination>

      {/* Botón Siguiente */}
      <BootstrapPagination size="sm" className="mb-0">
        <BootstrapPagination.Next
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </BootstrapPagination.Next>
      </BootstrapPagination>

      {/* Info de página */}
      <span className="text-muted small ms-2">
        Página {currentPage} de {totalPages}
      </span>
    </div>
  );
}

/**
 * Hook personalizado para manejar paginación
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const currentItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1
  };
}

